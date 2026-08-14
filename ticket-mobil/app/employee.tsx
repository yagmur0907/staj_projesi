import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, Modal, Switch, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker'; // YENİ: Galeri için eklendi

// TypeScript için bilet veri yapısını tanımlıyoruz
interface Bilet {
    id: number;
    konu: string;
    detay: string;
    durum: string;
    assigned_to: number | null;
    atanan_kisi_isim: string | null;
    okunmamis_mesaj_sayisi?: number;
    puan?: number | null;
}

export default function EmployeeScreen() {
    const [konu, setKonu] = useState('');
    const [detay, setDetay] = useState('');

    const [kategori, setKategori] = useState('Diğer');
    const kategoriler = ['Donanım', 'Yazılım', 'Ağ/İnternet', 'Diğer'];

    const [biletler, setBiletler] = useState<Bilet[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [yenileniyor, setYenileniyor] = useState(false);

    const [userId, setUserId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Profil Modalı ve Karanlık Mod State'leri
    const [profilModalGorunur, setProfilModalGorunur] = useState(false);
    const [karanlikMod, setKaranlikMod] = useState(false);

    // YENİ: Profil Fotoğrafı State'i
    const [profilResmi, setProfilResmi] = useState<string | null>(null);

    const router = useRouter();

    const cikisYap = async () => {
        await AsyncStorage.removeItem('kullaniciRol');
        await AsyncStorage.removeItem('kullaniciId');
        router.replace('/');
    };

    useEffect(() => {
        kullaniciyiYukleVeBiletleriGetir();
    }, []);

    const kullaniciyiYukleVeBiletleriGetir = async () => {
        try {
            const id = await AsyncStorage.getItem('kullaniciId');
            const rol = await AsyncStorage.getItem('kullaniciRol');
            if (id) {
                setUserId(id);
                setUserRole(rol);

                // YENİ: Kullanıcıya özel kaydedilmiş profil fotoğrafını hafızadan çekiyoruz
                const kaydedilmisResim = await AsyncStorage.getItem(`profil_resim_${id}`);
                if (kaydedilmisResim) {
                    setProfilResmi(kaydedilmisResim);
                }

                await biletleriGetir(id);
            } else {
                setYukleniyor(false);
            }
        } catch (error) {
            console.log(error);
            setYukleniyor(false);
        }
    };

    // YENİ: Galeriden fotoğraf seçip hem AsyncStorage'a hem sunucuya kaydeden fonksiyon
    const profilFotografiSec = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && userId) { // 'aktifKullaniciId' hatası 'userId' ile düzeltildi
            const localUri = result.assets[0].uri;

            // 1. Resmi Telefonda Göstermek için State'e Ata ve Hafızaya Kaydet
            setProfilResmi(localUri);
            await AsyncStorage.setItem(`profil_resim_${userId}`, localUri);

            // 2. Resmi Sunucuya (XAMPP) Yükle (Böylece herkes görebilecek)
            const formData = new FormData();
            formData.append('user_id', userId);

            const filename = localUri.split('/').pop() || 'avatar.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', {
                uri: localUri,
                name: filename,
                type: type,
            } as any);

            try {
                const response = await fetch('http://192.168.41.16/staj_projesi/upload_profile_image.php', {
                    method: 'POST',
                    headers: { 'Accept': 'application/json', 'Content-Type': 'multipart/form-data' },
                    body: formData,
                });
                const data = await response.json();
                if (data.durum !== 'basarili') {
                    Alert.alert('Uyarı', 'Fotoğraf sunucuya kaydedilemedi ama telefonda saklandı.');
                }
            } catch (error) {
                console.log("Fotoğraf yükleme hatası:", error);
            }
        }
    };
    const sayfayiYenile = async () => {
        if (!userId) return;

        setYenileniyor(true);

        try {
            await biletleriGetir(userId);
        } finally {
            setYenileniyor(false);
        }
    };

    const biletleriGetir = async (id: string) => {
        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/get_user_tickets.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: id })
            });
            const data = await response.json();

            if (data.durum === 'basarili') {
                setBiletler(data.biletler);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setYukleniyor(false);
        }
    };

    const biletGonder = async () => {
        if (konu === '' || detay === '') {
            Alert.alert('Eksik Bilgi', 'Lütfen konu ve detay alanlarını doldurun.');
            return;
        }

        const formatliKonu = `[${kategori}] ${konu}`;

        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/create_ticket.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    konu: formatliKonu,
                    detay: detay,
                    user_id: userId
                })
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', data.mesaj);
                setKonu('');
                setDetay('');
                setKategori('Diğer');
                if (userId) biletleriGetir(userId);
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. IP adresini kontrol et.');
            console.log(error);
        }
    };

    return (
        <View style={[styles.container, karanlikMod && styles.containerDark]}>

            {/* Profil Modalı */}
            <Modal
                visible={profilModalGorunur}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setProfilModalGorunur(false)}
            >
                <View style={styles.modalArkaPlan}>
                    <View style={[styles.profilKutusu, karanlikMod && styles.kutuDark]}>
                        <View style={[styles.profilBaslikAlani, karanlikMod && styles.cizgiDark]}>
                            <Text style={[styles.profilBaslikYazi, karanlikMod && styles.textDark]}>👤 Profilim</Text>
                            <TouchableOpacity onPress={() => setProfilModalGorunur(false)}>
                                <Text style={styles.kapatIkonu}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* YENİ: Yuvarlak Profil Fotoğrafı Alanı */}
                        <View style={styles.profilResimMerkez}>
                            <TouchableOpacity onPress={profilFotografiSec} style={styles.avatarKutusu}>
                                {profilResmi ? (
                                    <Image source={{ uri: profilResmi }} style={styles.avatarResim} />
                                ) : (
                                    <Text style={styles.avatarPlaceholder}>📷</Text>
                                )}
                            </TouchableOpacity>
                            <Text style={[styles.fotografDegistirYazi, karanlikMod && styles.textMutedDark]}>
                                Fotoğrafı değiştirmek için dokun
                            </Text>
                        </View>

                        <View style={styles.profilBilgiAlani}>
                            <Text style={[styles.bilgiEtiketi, karanlikMod && styles.textMutedDark]}>Rol:</Text>
                            <Text style={[styles.bilgiDegeri, karanlikMod && {color: '#28a745'}]}>
                                {userRole === 'support' ? 'IT Destek Uzmanı' : 'Çalışan'}
                            </Text>
                        </View>

                        <View style={[styles.ayarAlani, karanlikMod && styles.ayarAlaniDark]}>
                            <Text style={[styles.ayarYazi, karanlikMod && styles.textDark]}>🌙 Karanlık Mod</Text>
                            <Switch
                                value={karanlikMod}
                                onValueChange={(deger) => setKaranlikMod(deger)}
                                trackColor={{ false: "#767577", true: "#28a745" }}
                                thumbColor={karanlikMod ? "#fff" : "#f4f3f4"}
                            />
                        </View>

                        <TouchableOpacity onPress={cikisYap} style={styles.profilCikisButon}>
                            <Text style={styles.profilCikisYazi}>Güvenli Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <View style={styles.header}>
                <Text style={[styles.baslik, karanlikMod && styles.textDark]}>Destek Sistemi</Text>

                <TouchableOpacity onPress={() => setProfilModalGorunur(true)} style={[styles.profilButon, karanlikMod && styles.kutuDark]}>
                    <Text style={[styles.profilYazi, karanlikMod && {color: '#28a745'}]}>👤 Profil</Text>
                </TouchableOpacity>
            </View>

            {yukleniyor ? (
                <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={biletler}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={
                        <View style={styles.formContainer}>
                            <Text style={[styles.bilgiYazisi, karanlikMod && styles.textMutedDark]}>
                                Lütfen yaşadığınız sorunu kısaca özetleyin. IT ekibimiz en kısa sürede ilgilenecektir.
                            </Text>

                            <Text style={[styles.label, karanlikMod && styles.textDark]}>Sorun Kategorisi:</Text>
                            <View style={styles.kategoriContainer}>
                                {kategoriler.map((kat, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.kategoriButon,
                                            karanlikMod && styles.kutuDark,
                                            kategori === kat && styles.kategoriButonAktif,
                                            kategori === kat && karanlikMod && {backgroundColor: '#28a745'}
                                        ]}
                                        onPress={() => setKategori(kat)}
                                    >
                                        <Text style={[
                                            styles.kategoriYazi,
                                            karanlikMod && styles.textMutedDark,
                                            kategori === kat && styles.kategoriYaziAktif,
                                            kategori === kat && karanlikMod && {color: '#fff'}
                                        ]}>
                                            {kat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={[styles.label, karanlikMod && styles.textDark]}>Konu:</Text>
                            <TextInput
                                style={[styles.input, karanlikMod && styles.inputDark]}
                                placeholder="Örn: İnternet Kesintisi"
                                placeholderTextColor={karanlikMod ? "#888" : "#999"}
                                value={konu}
                                onChangeText={setKonu}
                            />

                            <Text style={[styles.label, karanlikMod && styles.textDark]}>Detay:</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, karanlikMod && styles.inputDark]}
                                placeholder="Lütfen sorunu detaylıca açıklayın..."
                                placeholderTextColor={karanlikMod ? "#888" : "#999"}
                                value={detay}
                                onChangeText={setDetay}
                                multiline={true}
                                numberOfLines={4}
                            />

                            <TouchableOpacity style={styles.gonderButon} onPress={biletGonder}>
                                <Text style={styles.gonderYazi}>Bileti Gönder</Text>
                            </TouchableOpacity>

                            <View style={[styles.ayiriciCizgi, karanlikMod && styles.cizgiDark]} />
                            <Text style={[styles.gecmisBaslik, karanlikMod && styles.textDark]}>Geçmiş Taleplerim</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.biletKarti, karanlikMod && styles.kutuDark]}
                            onPress={() => router.push({
                                pathname: '/ticket-detail',
                                params: {
                                    id: item.id,
                                    konu: item.konu,
                                    detay: item.detay,
                                    durum: item.durum,
                                    puan: item.puan != null ? item.puan.toString() : '',
                                    isDarkMode: karanlikMod ? '1' : '0'
                                }
                            })}
                        >
                            {/* Rozet (Çalışanlar için de mesaj bildirimi) */}
                            {(item.okunmamis_mesaj_sayisi ?? 0) > 0 && (
                                <View style={[styles.rozetContainer, karanlikMod && {borderColor: '#1e1e1e'}]}>
                                    <Text style={styles.rozetYazi}>
                                        {item.okunmamis_mesaj_sayisi}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.kartUst}>
                                <Text style={[styles.biletKonu, karanlikMod && styles.textDark]}>{item.konu}</Text>
                                <Text style={[
                                    styles.durum,
                                    item.durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik,
                                    karanlikMod && item.durum !== 'Çözüldü' && {backgroundColor: '#3d2b1f', color: '#f39c12'},
                                    karanlikMod && item.durum === 'Çözüldü' && {backgroundColor: '#1b3b24', color: '#2ecc71'}
                                ]}>
                                    {item.durum}
                                </Text>
                            </View>
                            <Text style={[styles.biletDetay, karanlikMod && styles.textMutedDark]}>{item.detay}</Text>

                            <View style={[styles.aksiyonKutusu, karanlikMod && styles.cizgiDark]}>
                                {item.assigned_to ? (
                                    <Text style={[styles.atananKisiMetni, karanlikMod && {color: '#2ecc71'}]}>
                                        👤 Sizinle İlgilenen: {item.atanan_kisi_isim}
                                    </Text>
                                ) : (
                                    <Text style={[styles.bekliyorMetni, karanlikMod && {color: '#f39c12'}]}>
                                        ⏳ Destek ekibi ataması bekleniyor...
                                    </Text>
                                )}

                                {item.durum === 'Çözüldü' && (
                                    <Text style={[
                                        styles.puanBilgisi,
                                        karanlikMod && styles.textMutedDark
                                    ]}>
                                        {item.puan != null
                                            ? `⭐ Değerlendirmeniz: ${item.puan}/5`
                                            : '⭐ Henüz değerlendirilmedi'}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <Text style={[styles.altYazi, karanlikMod && styles.textMutedDark]}>Henüz bir destek talebi oluşturmadınız.</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl
                            refreshing={yenileniyor}
                            onRefresh={sayfayiYenile}
                            colors={['#28a745']}
                            tintColor="#28a745"
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // --- STANDART MOD (LIGHT) STİLLERİ ---
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    baslik: { fontSize: 24, fontWeight: 'bold', color: '#333' },

    profilButon: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    profilYazi: { color: '#28a745', fontWeight: 'bold', fontSize: 13 },

    modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    profilKutusu: { backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 20, elevation: 5 },
    profilBaslikAlani: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 15, marginBottom: 15 },
    profilBaslikYazi: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    kapatIkonu: { fontSize: 20, color: '#999', fontWeight: 'bold' },

    // YENİ: Profil Resmi Stilleri
    profilResimMerkez: { alignItems: 'center', marginBottom: 20 },
    avatarKutusu: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#28a745' },
    avatarResim: { width: '100%', height: '100%' },
    avatarPlaceholder: { fontSize: 30 },
    fotografDegistirYazi: { fontSize: 12, color: '#666', marginTop: 6 },

    profilBilgiAlani: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    bilgiEtiketi: { fontSize: 15, color: '#666', fontWeight: 'bold' },
    bilgiDegeri: { fontSize: 15, color: '#28a745', fontWeight: 'bold' },
    ayarAlani: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 20 },
    ayarYazi: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    profilCikisButon: { backgroundColor: '#dc3545', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    profilCikisYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    formContainer: { marginBottom: 10 },
    bilgiYazisi: { fontSize: 14, color: '#666', marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#444', marginBottom: 8 },

    kategoriContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15, gap: 8 },
    kategoriButon: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#e0e0e0', borderRadius: 20, marginRight: 8, marginBottom: 8 },
    kategoriButonAktif: { backgroundColor: '#28a745' },
    kategoriYazi: { color: '#555', fontWeight: 'bold', fontSize: 13 },
    kategoriYaziAktif: { color: '#fff' },

    input: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#ddd', color: '#333' },
    textArea: { height: 120, textAlignVertical: 'top' },
    gonderButon: { backgroundColor: '#28a745', padding: 15, borderRadius: 8, alignItems: 'center' },
    gonderYazi: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

    ayiriciCizgi: { height: 1, backgroundColor: '#ddd', marginVertical: 20 },
    gecmisBaslik: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 },

    biletKarti: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    kartUst: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    biletKonu: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    durum: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
    durumAcik: { color: '#e67e22', backgroundColor: '#fdebd0' },
    durumCozuldu: { color: '#27ae60', backgroundColor: '#e9f7ef' },
    biletDetay: { fontSize: 14, color: '#666' },
    altYazi: { textAlign: 'center', color: '#888', marginTop: 20 },

    aksiyonKutusu: { marginTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 10 },
    atananKisiMetni: { fontSize: 13, color: '#28a745', fontWeight: 'bold', fontStyle: 'italic' },
    bekliyorMetni: { fontSize: 13, color: '#e67e22', fontStyle: 'italic' },
    puanBilgisi: {
        fontSize: 13,
        color: '#666',
        marginTop: 8,
        fontWeight: '600'
    },

    rozetContainer: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ff3b30', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10, paddingHorizontal: 6, borderWidth: 2, borderColor: '#f5f5f5' },
    rozetYazi: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // --- KARANLIK MOD (DARK MODE) STİLLERİ ---
    containerDark: { backgroundColor: '#121212' },
    kutuDark: { backgroundColor: '#1e1e1e', shadowOpacity: 0, borderColor: '#333', borderWidth: 1 },
    textDark: { color: '#ffffff' },
    textMutedDark: { color: '#aaaaaa' },
    cizgiDark: { borderColor: '#333333' },
    ayarAlaniDark: { backgroundColor: '#2c2c2c' },
    inputDark: { backgroundColor: '#2c2c2c', borderColor: '#444', color: '#fff' }
});