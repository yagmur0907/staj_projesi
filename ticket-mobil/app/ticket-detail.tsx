import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface Mesaj {
    id: number;
    mesaj: string;
    image_url: string | null;
    gonderim_tarihi: string;
    user_id: number;
    isim_soyisim: string;
    role: string;
    profile_image: string | null;
}

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
};

export default function TicketDetailScreen() {
    const params = useLocalSearchParams();
    const id = String(params.id || '');
    const konu = String(params.konu || '');
    const detay = String(params.detay || '');
    const durum = String(params.durum || '');
    const puanParam = params.puan;
    const puanYorumuParam = params.puanYorumu;
    const isDarkMode = String(params.isDarkMode || '0');
    const router = useRouter();
    const karanlikMod = isDarkMode === '1';

    const mevcutPuan = puanParam && String(puanParam) !== 'null' && String(puanParam) !== 'undefined' ? Number(puanParam) : null;
    const mevcutPuanYorumu = puanYorumuParam && String(puanYorumuParam) !== 'null' && String(puanYorumuParam) !== 'undefined' ? String(puanYorumuParam) : '';

    const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
    const [yeniMesaj, setYeniMesaj] = useState('');
    const [aktifKullaniciId, setAktifKullaniciId] = useState<string | null>(null);
    const [aktifKullaniciRol, setAktifKullaniciRol] = useState<string | null>(null);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [seciliResim, setSeciliResim] = useState<string | null>(null);
    const [tamEkranResim, setTamEkranResim] = useState<string | null>(null);
    const [secilenPuan, setSecilenPuan] = useState(0);
    const [puanYorumu, setPuanYorumu] = useState('');
    const [puanGonderiliyor, setPuanGonderiliyor] = useState(false);
    const [puanVerildi, setPuanVerildi] = useState(mevcutPuan !== null);

    useEffect(() => {
        kullaniciIdAlVeMesajlariGetir();
        mesajlariOkunduIsaretle();
    }, []);

    const mesajlariOkunduIsaretle = async () => {
        try {
            await fetch('http://192.168.41.16/staj_projesi/mark_messages_read.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: id })
            });
        } catch (error) {
            console.log('Okundu işaretleme hatası:', error);
        }
    };

    const kullaniciIdAlVeMesajlariGetir = async () => {
        try {
            const userId = await AsyncStorage.getItem('kullaniciId');
            const userRole = await AsyncStorage.getItem('kullaniciRol');
            setAktifKullaniciId(userId);
            setAktifKullaniciRol(userRole);
            await mesajlariCek();
        } catch (error) {
            console.log(error);
        } finally {
            setYukleniyor(false);
        }
    };

    const mesajlariCek = async () => {
        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/get_messages.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: id })
            });
            const data = await response.json();
            if (data.durum === 'basarili') setMesajlar(Array.isArray(data.mesajlar) ? data.mesajlar : []);
        } catch (error) {
            console.log('Mesaj çekme hatası:', error);
        }
    };

    const fotografSec = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7
        });

        if (!result.canceled && result.assets.length > 0) setSeciliResim(result.assets[0].uri);
    };

    const mesajGonder = async () => {
        if (yeniMesaj.trim() === '' && !seciliResim) return;
        if (!aktifKullaniciId) return;

        const formData = new FormData();
        formData.append('ticket_id', id);
        formData.append('user_id', aktifKullaniciId);
        formData.append('mesaj', yeniMesaj);

        if (seciliResim) {
            const filename = seciliResim.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            formData.append('image', { uri: seciliResim, name: filename, type } as any);
        }

        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/send_message.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
                body: formData
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                setYeniMesaj('');
                setSeciliResim(null);
                await mesajlariCek();
            } else {
                Alert.alert('Hata', data.mesaj || 'Mesaj gönderilemedi.');
            }
        } catch (error) {
            console.log('Mesaj gönderme hatası:', error);
            Alert.alert('Bağlantı Hatası', 'Mesaj gönderilemedi.');
        }
    };

    const puanGonder = async () => {
        if (!aktifKullaniciId) {
            Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı.');
            return;
        }

        if (secilenPuan < 1 || secilenPuan > 5) {
            Alert.alert('Puan Seçin', 'Lütfen 1 ile 5 arasında bir puan seçin.');
            return;
        }

        setPuanGonderiliyor(true);

        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/submit_rating.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_id: Number(id),
                    user_id: Number(aktifKullaniciId),
                    rating: secilenPuan,
                    comment: puanYorumu.trim()
                })
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                setPuanVerildi(true);
                Alert.alert('Teşekkürler!', 'Değerlendirmeniz başarıyla kaydedildi.');
            } else {
                Alert.alert('Hata', data.mesaj || 'Değerlendirme kaydedilemedi.');
            }
        } catch (error) {
            console.log('Puan gönderme hatası:', error);
            Alert.alert('Bağlantı Hatası', 'Değerlendirme gönderilemedi.');
        } finally {
            setPuanGonderiliyor(false);
        }
    };

    const renderMesaj = ({ item }: { item: Mesaj }) => {
        const benimMesajim = String(item.user_id) === String(aktifKullaniciId);
        const resimTamYol = item.image_url ? `http://192.168.41.16/staj_projesi/${item.image_url}` : null;
        const sunucuProfilResmi = item.profile_image ? `http://192.168.41.16/staj_projesi/${item.profile_image}` : null;
        const ilkHarf = item.isim_soyisim ? item.isim_soyisim.charAt(0).toUpperCase() : '?';
        const avatarRengi = stringToColor(item.isim_soyisim || 'Bilinmeyen');
        const mesajMetni = typeof item.mesaj === 'string' ? item.mesaj : String(item.mesaj || '');

        return (
            <View style={[styles.mesajKapsayici, benimMesajim ? styles.satirSag : styles.satirSol]}>
                {!benimMesajim && (
                    <View style={[styles.kucukAvatar, !sunucuProfilResmi && { backgroundColor: avatarRengi }]}>
                        {sunucuProfilResmi ? <Image source={{ uri: sunucuProfilResmi }} style={styles.kucukAvatarResim} /> : <Text style={styles.avatarHarf}>{ilkHarf}</Text>}
                    </View>
                )}

                <View style={styles.mesajIcerikAlani}>
                    {!benimMesajim && (
                        <Text style={[styles.gonderenIsim, karanlikMod && styles.gonderenIsimDark]}>
                            {item.isim_soyisim} ({item.role === 'support' ? 'IT Destek' : 'Çalışan'})
                        </Text>
                    )}

                    <View style={[styles.baloncuk, benimMesajim ? styles.baloncukBen : styles.baloncukKarsi, karanlikMod && (benimMesajim ? styles.baloncukBenDark : styles.baloncukKarsiDark)]}>
                        {resimTamYol && (
                            <TouchableOpacity onPress={() => setTamEkranResim(resimTamYol)}>
                                <Image source={{ uri: resimTamYol }} style={styles.mesajResmi} resizeMode="cover" />
                            </TouchableOpacity>
                        )}

                        {mesajMetni.trim() !== '' && (
                            <Text style={[styles.mesajMetni, benimMesajim ? styles.metinBen : styles.metinKarsi, karanlikMod && styles.metinDark]}>
                                {mesajMetni}
                            </Text>
                        )}

                        <Text style={[styles.tarihMetni, karanlikMod && styles.tarihMetniDark]}>
                            {item.gonderim_tarihi ? item.gonderim_tarihi.substring(11, 16) : ''}
                        </Text>
                    </View>
                </View>

                {benimMesajim && (
                    <View style={[styles.kucukAvatarBen, !sunucuProfilResmi && { backgroundColor: avatarRengi }]}>
                        {sunucuProfilResmi ? <Image source={{ uri: sunucuProfilResmi }} style={styles.kucukAvatarResim} /> : <Text style={styles.avatarHarf}>{ilkHarf}</Text>}
                    </View>
                )}
            </View>
        );
    };

    const calisanPuanlamaAlani = () => {
        if (durum !== 'Çözüldü' || aktifKullaniciRol !== 'employee') return null;

        return (
            <View style={[styles.puanlamaKutusu, karanlikMod && styles.puanlamaKutusuDark]}>
                {!puanVerildi ? (
                    <>
                        <Text style={[styles.puanlamaBaslik, karanlikMod && styles.textDark]}>⭐ Destek Hizmetini Değerlendirin</Text>
                        <Text style={[styles.puanlamaAltMetin, karanlikMod && styles.tarihMetniDark]}>Aldığınız destekten ne kadar memnun kaldınız?</Text>

                        <View style={styles.yildizContainer}>
                            {[1, 2, 3, 4, 5].map((yildiz) => (
                                <TouchableOpacity key={yildiz} onPress={() => setSecilenPuan(yildiz)} style={styles.yildizButon}>
                                    <Text style={[styles.yildiz, yildiz <= secilenPuan && styles.yildizSecili]}>{yildiz <= secilenPuan ? '★' : '☆'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            style={[styles.puanYorumInput, karanlikMod && styles.puanYorumInputDark]}
                            placeholder="Yorumunuz (opsiyonel)"
                            placeholderTextColor={karanlikMod ? '#888' : '#999'}
                            value={puanYorumu}
                            onChangeText={setPuanYorumu}
                            multiline
                        />

                        <TouchableOpacity style={[styles.puanGonderButon, secilenPuan === 0 && styles.puanGonderButonPasif]} onPress={puanGonder} disabled={secilenPuan === 0 || puanGonderiliyor}>
                            {puanGonderiliyor ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.puanGonderYazi}>Puanı Gönder</Text>}
                        </TouchableOpacity>
                    </>
                ) : (
                    <View style={styles.puanVerildiAlani}>
                        <Text style={[styles.puanlamaBaslik, karanlikMod && styles.textDark]}>Değerlendirmeniz</Text>
                        <Text style={styles.verilenYildizlar}>{'★'.repeat(mevcutPuan || secilenPuan)}{'☆'.repeat(5 - (mevcutPuan || secilenPuan))}</Text>
                        {mevcutPuanYorumu !== '' && <Text style={[styles.puanTesekkur, karanlikMod && styles.tarihMetniDark]}>“{mevcutPuanYorumu}”</Text>}
                        <Text style={[styles.puanTesekkur, karanlikMod && styles.tarihMetniDark]}>Teşekkür ederiz!</Text>
                    </View>
                )}
            </View>
        );
    };

    const destekPuanlamaAlani = () => {
        if (durum !== 'Çözüldü' || aktifKullaniciRol !== 'support' || mevcutPuan === null) return null;

        return (
            <View style={[styles.puanlamaKutusu, karanlikMod && styles.puanlamaKutusuDark]}>
                <Text style={[styles.puanlamaBaslik, karanlikMod && styles.textDark]}>⭐ Çalışan Değerlendirmesi</Text>
                <Text style={styles.verilenYildizlar}>{'★'.repeat(Math.min(Math.max(mevcutPuan, 0), 5))}{'☆'.repeat(5 - Math.min(Math.max(mevcutPuan, 0), 5))}</Text>

                {mevcutPuanYorumu !== '' && (
                    <View style={[styles.calisanYorumKutusu, karanlikMod && styles.calisanYorumKutusuDark]}>
                        <Text style={[styles.calisanYorumBaslik, karanlikMod && styles.textDark]}>Çalışanın Yorumu:</Text>
                        <Text style={[styles.calisanYorum, karanlikMod && styles.textDark]}>“{mevcutPuanYorumu}”</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, karanlikMod && styles.containerDark]}>
            <Modal visible={tamEkranResim !== null} transparent animationType="fade" onRequestClose={() => setTamEkranResim(null)}>
                <View style={styles.modalArkaPlan}>
                    <TouchableOpacity style={styles.modalKapatButon} onPress={() => setTamEkranResim(null)}>
                        <Text style={styles.modalKapatYazi}>✕ Kapat</Text>
                    </TouchableOpacity>
                    {tamEkranResim && <Image source={{ uri: tamEkranResim }} style={styles.modalResim} resizeMode="contain" />}
                </View>
            </Modal>

            <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={[styles.header, karanlikMod && styles.headerDark]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.geriButon}>
                        <Text style={[styles.geriYazi, karanlikMod && styles.geriYaziDark]}>{"< Geri"}</Text>
                    </TouchableOpacity>

                    <View style={styles.baslikKutusu}>
                        <Text style={[styles.konuBaslik, karanlikMod && styles.textDark]} numberOfLines={1}>{konu}</Text>
                        <Text style={[styles.durumBadge, durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik, karanlikMod && durum === 'Çözüldü' && styles.durumCozulduDark, karanlikMod && durum !== 'Çözüldü' && styles.durumAcikDark]}>{durum}</Text>
                    </View>
                </View>

                <View style={[styles.biletDetayKutusu, karanlikMod && styles.biletDetayKutusuDark]}>
                    <Text style={[styles.detayBaslik, karanlikMod && styles.tarihMetniDark]}>Sorun Detayı:</Text>
                    <Text style={[styles.detayMetin, karanlikMod && styles.textDark]}>{detay}</Text>
                </View>

                {yukleniyor ? (
                    <ActivityIndicator size="large" color="#007bff" style={styles.yukleniyor} />
                ) : (
                    <FlatList
                        data={mesajlar}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderMesaj}
                        contentContainerStyle={styles.sohbetAlani}
                        ListEmptyComponent={<Text style={[styles.bosMesaj, karanlikMod && styles.tarihMetniDark]}>Henüz bir yanıt yok. Buradan iletişime geçebilirsiniz.</Text>}
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                {calisanPuanlamaAlani()}
                {destekPuanlamaAlani()}

                <View style={[styles.altGrup, karanlikMod && styles.altGrupDark]}>
                    {seciliResim && (
                        <View style={styles.onizlemeKutusu}>
                            <Image source={{ uri: seciliResim }} style={styles.onizlemeResmi} />
                            <TouchableOpacity style={styles.onizlemeIptal} onPress={() => setSeciliResim(null)}>
                                <Text style={styles.iptalYazi}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputAlani}>
                        <TouchableOpacity style={styles.kameraButon} onPress={fotografSec}>
                            <Text style={styles.kameraYazi}>📷</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.mesajInput, karanlikMod && styles.mesajInputDark]}
                            placeholder="Mesajınızı yazın..."
                            placeholderTextColor={karanlikMod ? '#888' : '#999'}
                            value={yeniMesaj}
                            onChangeText={setYeniMesaj}
                            multiline
                        />

                        <TouchableOpacity style={[styles.gonderButon, karanlikMod && styles.gonderButonDark]} onPress={mesajGonder}>
                            <Text style={styles.gonderYazi}>Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#f0f2f5' },
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, borderColor: '#ddd' },
    headerDark: { backgroundColor: '#1e1e1e', borderBottomColor: '#333' },
    geriButon: { marginRight: 15, paddingVertical: 5 },
    geriYazi: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
    geriYaziDark: { color: '#4fc3f7' },
    baslikKutusu: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    konuBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    durumBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
    durumAcik: { backgroundColor: '#fdebd0', color: '#e67e22' },
    durumCozuldu: { backgroundColor: '#e9f7ef', color: '#27ae60' },
    durumAcikDark: { backgroundColor: '#3d2b1f', color: '#f39c12' },
    durumCozulduDark: { backgroundColor: '#1b3b24', color: '#2ecc71' },
    biletDetayKutusu: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    biletDetayKutusuDark: { backgroundColor: '#1e1e1e', borderBottomColor: '#333' },
    detayBaslik: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    detayMetin: { fontSize: 14, color: '#444' },
    sohbetAlani: { padding: 15, paddingBottom: 20 },
    bosMesaj: { textAlign: 'center', color: '#999', marginTop: 20 },
    yukleniyor: { flex: 1 },
    mesajKapsayici: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end', maxWidth: '85%' },
    satirSol: { alignSelf: 'flex-start' },
    satirSag: { alignSelf: 'flex-end' },
    kucukAvatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 8, marginBottom: 2, overflow: 'hidden' },
    kucukAvatarBen: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2, overflow: 'hidden' },
    kucukAvatarResim: { width: '100%', height: '100%' },
    avatarHarf: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    mesajIcerikAlani: { flex: 1 },
    gonderenIsim: { fontSize: 11, color: '#888', marginBottom: 4, marginLeft: 4 },
    gonderenIsimDark: { color: '#aaa' },
    baloncuk: { padding: 12, borderRadius: 15, minWidth: 100 },
    baloncukBen: { backgroundColor: '#dcf8c6', borderBottomRightRadius: 0 },
    baloncukKarsi: { backgroundColor: '#fff', borderBottomLeftRadius: 0, borderWidth: 1, borderColor: '#e0e0e0' },
    baloncukBenDark: { backgroundColor: '#005c4b' },
    baloncukKarsiDark: { backgroundColor: '#2c2c2c', borderColor: '#444' },
    mesajResmi: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
    mesajMetni: { fontSize: 15 },
    metinBen: { color: '#000' },
    metinKarsi: { color: '#333' },
    metinDark: { color: '#e0e0e0' },
    tarihMetni: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 5 },
    tarihMetniDark: { color: '#888' },
    puanlamaKutusu: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd', padding: 15 },
    puanlamaKutusuDark: { backgroundColor: '#1e1e1e', borderColor: '#333' },
    puanlamaBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
    puanlamaAltMetin: { fontSize: 13, color: '#777', textAlign: 'center', marginBottom: 10 },
    yildizContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    yildizButon: { paddingHorizontal: 5 },
    yildiz: { fontSize: 34, color: '#ccc' },
    yildizSecili: { color: '#f5b301' },
    puanYorumInput: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 60, maxHeight: 90, fontSize: 14, color: '#333', marginBottom: 10, textAlignVertical: 'top' },
    puanYorumInputDark: { backgroundColor: '#2c2c2c', borderColor: '#444', color: '#fff' },
    puanGonderButon: { backgroundColor: '#28a745', paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    puanGonderButonPasif: { backgroundColor: '#9e9e9e' },
    puanGonderYazi: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
    puanVerildiAlani: { alignItems: 'center', paddingVertical: 5 },
    verilenYildizlar: { fontSize: 30, color: '#f5b301', marginVertical: 4 },
    puanTesekkur: { fontSize: 13, color: '#777', textAlign: 'center', marginTop: 5 },
    calisanYorumKutusu: { marginTop: 8, backgroundColor: '#f8f9fa', padding: 10, borderRadius: 8, width: '100%' },
    calisanYorumKutusuDark: { backgroundColor: '#2c2c2c' },
    calisanYorumBaslik: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 4 },
    calisanYorum: { fontSize: 14, color: '#333', fontStyle: 'italic' },
    altGrup: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
    altGrupDark: { backgroundColor: '#1e1e1e', borderTopColor: '#333' },
    onizlemeKutusu: { padding: 10, position: 'relative', alignSelf: 'flex-start' },
    onizlemeResmi: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    onizlemeIptal: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    iptalYazi: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    inputAlani: { flexDirection: 'row', padding: 10, paddingBottom: Platform.OS === 'android' ? 25 : 10, alignItems: 'flex-end' },
    kameraButon: { paddingVertical: 12, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
    kameraYazi: { fontSize: 24 },
    mesajInput: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
    mesajInputDark: { backgroundColor: '#2c2c2c', borderColor: '#444', color: '#fff' },
    gonderButon: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, marginLeft: 10, justifyContent: 'center' },
    gonderButonDark: { backgroundColor: '#0277bd' },
    gonderYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalKapatButon: { position: 'absolute', top: Platform.OS === 'android' ? 50 : 60, right: 20, zIndex: 1, paddingVertical: 8, paddingHorizontal: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    modalKapatYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    modalResim: { width: '100%', height: '80%' },
    containerDark: { backgroundColor: '#121212' },
    textDark: { color: '#fff' }
});