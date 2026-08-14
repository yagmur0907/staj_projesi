import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl, Dimensions, TextInput, Modal, Switch, Image } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart } from 'react-native-chart-kit';
import * as ImagePicker from 'expo-image-picker';

interface Bilet {
    id: number;
    konu: string;
    detay: string;
    durum: string;
    assigned_to: number | null;
    atanan_kisi_isim: string | null;
    okunmamis_mesaj_sayisi: number;
}

const screenWidth = Dimensions.get('window').width;

export default function SupportScreen() {
    const router = useRouter();
    const [biletler, setBiletler] = useState<Bilet[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [seciliFiltre, setSeciliFiltre] = useState('Tümü');
    const [aramaMetni, setAramaMetni] = useState('');

    const [aktifKullaniciId, setAktifKullaniciId] = useState<string | null>(null);
    const [aktifKullaniciRol, setAktifKullaniciRol] = useState<string | null>(null);

    // Profil Modalı ve Karanlık Mod State'leri
    const [profilModalGorunur, setProfilModalGorunur] = useState(false);
    const [karanlikMod, setKaranlikMod] = useState(false);

    // Profil Fotoğrafı State'i
    const [profilResmi, setProfilResmi] = useState<string | null>(null);

    const cikisYap = async () => {
        await AsyncStorage.removeItem('kullaniciRol');
        await AsyncStorage.removeItem('kullaniciId');
        router.replace('/');
    };

    const biletleriGetir = async () => {
        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/get_tickets.php');
            const data = await response.json();

            if (data.durum === 'basarili') {
                setBiletler(data.biletler);
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Bağlantı Hatası', 'Sunucudan biletler alınamadı.');
        } finally {
            setYukleniyor(false);
        }
    };

    const biletAta = async (ticketId: number) => {
        if (!aktifKullaniciId) return;
        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/assign_ticket.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket_id: ticketId, support_user_id: aktifKullaniciId })
            });
            const data = await response.json();
            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', 'Bilet üzerinize atandı!');
                biletleriGetir();
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Bağlantı Hatası', 'Atama işlemi tamamlanamadı.');
        }
    };

    const biletCozulduIsaretle = async (id: number) => {
        try {
            const response = await fetch('http://192.168.41.16/staj_projesi/update_ticket.php', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            const data = await response.json();
            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', 'Bilet çözüldü olarak işaretlendi!');
                biletleriGetir();
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Bağlantı Hatası', 'İşlem tamamlanamadı.');
        }
    };

    const sayfayiYenile = async () => {
        setYenileniyor(true);
        await biletleriGetir();
        setYenileniyor(false);
    };

    useEffect(() => {
        const kullaniciBilgileriniAl = async () => {
            const id = await AsyncStorage.getItem('kullaniciId');
            const rol = await AsyncStorage.getItem('kullaniciRol');
            setAktifKullaniciId(id);
            setAktifKullaniciRol(rol);

            // Kullanıcıya özel kaydedilmiş profil fotoğrafını hafızadan çekiyoruz
            if (id) {
                const kaydedilmisResim = await AsyncStorage.getItem(`profil_resim_${id}`);
                if (kaydedilmisResim) {
                    setProfilResmi(kaydedilmisResim);
                }
            }
        };
        kullaniciBilgileriniAl();
        biletleriGetir();
    }, []);

    // Galeriden fotoğraf seçip hem AsyncStorage'a hem sunucuya kaydeden fonksiyon
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

        if (!result.canceled && aktifKullaniciId) {
            const localUri = result.assets[0].uri;

            // 1. Resmi Telefonda Göstermek için State'e Ata ve Hafızaya Kaydet
            setProfilResmi(localUri);
            await AsyncStorage.setItem(`profil_resim_${aktifKullaniciId}`, localUri);

            // 2. Resmi Sunucuya (XAMPP) Yükle (Böylece herkes görebilecek)
            const formData = new FormData();
            formData.append('user_id', aktifKullaniciId);

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

    const filtrelenmisBiletler = biletler.filter(bilet => {
        const sekmeUyumu = seciliFiltre === 'Tümü' || bilet.durum === seciliFiltre;
        const aramaKucukHarf = aramaMetni.toLowerCase();
        const aramaUyumu =
            bilet.konu.toLowerCase().includes(aramaKucukHarf) ||
            bilet.detay.toLowerCase().includes(aramaKucukHarf) ||
            (bilet.atanan_kisi_isim && bilet.atanan_kisi_isim.toLowerCase().includes(aramaKucukHarf));
        return sekmeUyumu && aramaUyumu;
    });

    const toplamBilet = biletler.length;
    const acikBilet = biletler.filter(b => b.durum !== 'Çözüldü').length;
    const cozulduBilet = biletler.filter(b => b.durum === 'Çözüldü').length;

    const yaziRengi = karanlikMod ? "#ccc" : "#555";
    const grafikVerisi = [
        { name: "Açık", adet: acikBilet, color: "#e67e22", legendFontColor: yaziRengi, legendFontSize: 13 },
        { name: "Çözüldü", adet: cozulduBilet, color: "#27ae60", legendFontColor: yaziRengi, legendFontSize: 13 }
    ];

    const renderDashboard = () => {
        if (toplamBilet === 0) return null;
        return (
            <View style={styles.dashboardContainer}>
                <Text style={[styles.dashboardBaslik, karanlikMod && styles.textDark]}>📊 Sistem Özeti</Text>

                <View style={styles.istatistikSatiri}>
                    <View style={[styles.istatistikKarti, karanlikMod && styles.kutuDark, { borderTopColor: '#0277bd' }]}>
                        <Text style={[styles.istatistikSayi, karanlikMod && styles.textDark]}>{toplamBilet}</Text>
                        <Text style={[styles.istatistikYazi, karanlikMod && styles.textMutedDark]}>Toplam</Text>
                    </View>
                    <View style={[styles.istatistikKarti, karanlikMod && styles.kutuDark, { borderTopColor: '#e67e22' }]}>
                        <Text style={[styles.istatistikSayi, karanlikMod && styles.textDark]}>{acikBilet}</Text>
                        <Text style={[styles.istatistikYazi, karanlikMod && styles.textMutedDark]}>Açık</Text>
                    </View>
                    <View style={[styles.istatistikKarti, karanlikMod && styles.kutuDark, { borderTopColor: '#27ae60' }]}>
                        <Text style={[styles.istatistikSayi, karanlikMod && styles.textDark]}>{cozulduBilet}</Text>
                        <Text style={[styles.istatistikYazi, karanlikMod && styles.textMutedDark]}>Çözüldü</Text>
                    </View>
                </View>

                <View style={[styles.grafikKutusu, karanlikMod && styles.kutuDark]}>
                    <PieChart
                        data={grafikVerisi}
                        width={screenWidth - 60}
                        height={120}
                        chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
                        accessor={"adet"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                </View>

                <View style={[styles.aramaKutusuContainer, karanlikMod && styles.kutuDark]}>
                    <Text style={styles.aramaIkonu}>🔍</Text>
                    <TextInput
                        style={[styles.aramaInput, karanlikMod && styles.textDark]}
                        placeholder="Konu, detay veya kişi ara..."
                        placeholderTextColor={karanlikMod ? "#888" : "#999"}
                        value={aramaMetni}
                        onChangeText={setAramaMetni}
                    />
                    {aramaMetni.length > 0 && (
                        <TouchableOpacity onPress={() => setAramaMetni('')}>
                            <Text style={styles.aramaTemizleIkonu}>❌</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
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

                        {/* Yuvarlak Profil Fotoğrafı Alanı */}
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
                            <Text style={[styles.bilgiDegeri, karanlikMod && {color: '#4fc3f7'}]}>
                                {aktifKullaniciRol === 'support' ? 'IT Destek Uzmanı' : 'Çalışan'}
                            </Text>
                        </View>

                        <View style={[styles.ayarAlani, karanlikMod && styles.ayarAlaniDark]}>
                            <Text style={[styles.ayarYazi, karanlikMod && styles.textDark]}>🌙 Karanlık Mod</Text>
                            <Switch
                                value={karanlikMod}
                                onValueChange={(deger) => setKaranlikMod(deger)}
                                trackColor={{ false: "#767577", true: "#0277bd" }}
                                thumbColor={karanlikMod ? "#fff" : "#f4f3f4"}
                            />
                        </View>

                        <TouchableOpacity onPress={cikisYap} style={styles.profilCikisButon}>
                            <Text style={styles.profilCikisYazi}>Güvenli Çıkış Yap</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Üst Kısım (Header) */}
            <View style={styles.header}>
                <Text style={[styles.baslik, karanlikMod && {color: '#4fc3f7'}]}>IT Destek</Text>

                <TouchableOpacity onPress={() => setProfilModalGorunur(true)} style={[styles.profilButon, karanlikMod && styles.kutuDark]}>
                    <Text style={[styles.profilYazi, karanlikMod && {color: '#4fc3f7'}]}>👤 Profil</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.filtreContainer, karanlikMod && styles.kutuDark]}>
                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Tümü' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Tümü')}
                >
                    <Text style={[styles.filtreYazi, karanlikMod && styles.textMutedDark, seciliFiltre === 'Tümü' && styles.filtreYaziAktif]}>Tümü</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Açık' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Açık')}
                >
                    <Text style={[styles.filtreYazi, karanlikMod && styles.textMutedDark, seciliFiltre === 'Açık' && styles.filtreYaziAktif]}>Açık</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Çözüldü' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Çözüldü')}
                >
                    <Text style={[styles.filtreYazi, karanlikMod && styles.textMutedDark, seciliFiltre === 'Çözüldü' && styles.filtreYaziAktif]}>Çözüldü</Text>
                </TouchableOpacity>
            </View>

            {yukleniyor ? (
                <View style={styles.icerik}>
                    <ActivityIndicator size="large" color="#0277bd" />
                </View>
            ) : (
                <FlatList
                    data={filtrelenmisBiletler}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={renderDashboard()}
                    refreshControl={
                        <RefreshControl refreshing={yenileniyor} onRefresh={sayfayiYenile} colors={['#0277bd']} tintColor={karanlikMod ? "#fff" : "#0277bd"} />
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
                                    isDarkMode: karanlikMod ? '1' : '0'
                                }
                            })}
                            activeOpacity={0.8}
                        >
                            {item.okunmamis_mesaj_sayisi > 0 && (
                                <View style={[styles.rozetContainer, karanlikMod && {borderColor: '#1e1e1e'}]}>
                                    <Text style={styles.rozetYazi}>
                                        {item.okunmamis_mesaj_sayisi}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.kartUst}>
                                <Text style={[styles.konu, karanlikMod && styles.textDark]}>{item.konu}</Text>
                                <Text style={[styles.durum, item.durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik]}>
                                    {item.durum}
                                </Text>
                            </View>
                            <Text style={[styles.detay, karanlikMod && styles.textMutedDark]}>{item.detay}</Text>

                            <View style={[styles.aksiyonKutusu, karanlikMod && styles.cizgiDark]}>
                                {item.durum !== 'Çözüldü' ? (
                                    item.assigned_to ? (
                                        <Text style={[styles.atananKisiMetni, karanlikMod && {color: '#4fc3f7'}]}>👤 İlgilenen: {item.atanan_kisi_isim}</Text>
                                    ) : (
                                        <TouchableOpacity style={styles.ataButon} onPress={() => biletAta(item.id)}>
                                            <Text style={styles.ataButonYazi}>✋ Bana Ata</Text>
                                        </TouchableOpacity>
                                    )
                                ) : (
                                    <Text style={[styles.kapaliBiletMetni, karanlikMod && styles.textMutedDark]}>
                                        {item.assigned_to ? `👤 İlgilenen: ${item.atanan_kisi_isim}` : '🔒 Çözüldü'}
                                    </Text>
                                )}

                                {item.durum !== 'Çözüldü' && (
                                    <TouchableOpacity style={styles.aksiyonButon} onPress={() => biletCozulduIsaretle(item.id)}>
                                        <Text style={styles.aksiyonButonYazi}>✓ Çözüldü</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.icerik}>
                            <Text style={[styles.altYazi, karanlikMod && styles.textMutedDark]}>Bu arama ve filtreye uygun destek talebi bulunmuyor.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // --- STANDART MOD (LIGHT) STİLLERİ ---
    container: { flex: 1, backgroundColor: '#e3f2fd', padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    baslik: { fontSize: 24, fontWeight: 'bold', color: '#0277bd' },

    profilButon: { backgroundColor: '#fff', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    profilYazi: { color: '#0277bd', fontWeight: 'bold', fontSize: 13 },

    modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    profilKutusu: { backgroundColor: '#fff', width: '100%', borderRadius: 15, padding: 20, elevation: 5 },
    profilBaslikAlani: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee', paddingBottom: 15, marginBottom: 15 },
    profilBaslikYazi: { fontSize: 18, fontWeight: 'bold', color: '#333' },
    kapatIkonu: { fontSize: 20, color: '#999', fontWeight: 'bold' },

    profilResimMerkez: { alignItems: 'center', marginBottom: 20 },
    avatarKutusu: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#0277bd' },
    avatarResim: { width: '100%', height: '100%' },
    avatarPlaceholder: { fontSize: 30 },
    fotografDegistirYazi: { fontSize: 12, color: '#666', marginTop: 6 },

    profilBilgiAlani: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    bilgiEtiketi: { fontSize: 15, color: '#666', fontWeight: 'bold' },
    bilgiDegeri: { fontSize: 15, color: '#0277bd', fontWeight: 'bold' },
    ayarAlani: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: 15, borderRadius: 10, marginBottom: 20 },
    ayarYazi: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    profilCikisButon: { backgroundColor: '#dc3545', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    profilCikisYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    filtreContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, backgroundColor: '#fff', padding: 5, borderRadius: 8 },
    filtreButon: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
    filtreButonAktif: { backgroundColor: '#0277bd' },
    filtreYazi: { fontSize: 14, fontWeight: 'bold', color: '#666' },
    filtreYaziAktif: { color: '#fff' },

    icerik: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    altYazi: { fontSize: 16, color: '#666', textAlign: 'center' },

    biletKarti: { backgroundColor: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
    kartUst: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
    konu: { fontSize: 16, fontWeight: 'bold', color: '#2c3e50', flex: 1 },
    durum: { fontSize: 12, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
    durumAcik: { color: '#e67e22', backgroundColor: '#fdebd0' },
    durumCozuldu: { color: '#27ae60', backgroundColor: '#e9f7ef' },
    detay: { fontSize: 14, color: '#555', marginBottom: 10 },
    aksiyonKutusu: { marginTop: 10, borderTopWidth: 1, borderColor: '#f0f0f0', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    atananKisiMetni: { fontSize: 13, color: '#0277bd', fontWeight: 'bold', fontStyle: 'italic', flex: 1 },
    kapaliBiletMetni: { fontSize: 13, color: '#888', fontStyle: 'italic', flex: 1 },
    ataButon: { backgroundColor: '#ff9800', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, marginRight: 10 },
    ataButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
    aksiyonButon: { backgroundColor: '#4caf50', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 5, alignItems: 'center' },
    aksiyonButonYazi: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    dashboardContainer: { marginBottom: 20 },
    dashboardBaslik: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10 },
    istatistikSatiri: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
    istatistikKarti: { flex: 1, backgroundColor: '#fff', paddingVertical: 15, alignItems: 'center', borderRadius: 8, marginHorizontal: 4, borderTopWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
    istatistikSayi: { fontSize: 22, fontWeight: 'bold', color: '#333' },
    istatistikYazi: { fontSize: 12, color: '#666', marginTop: 5, fontWeight: 'bold' },
    grafikKutusu: { backgroundColor: '#fff', borderRadius: 8, padding: 10, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, marginBottom: 15 },

    aramaKutusuContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, height: 45, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, marginBottom: 5 },
    aramaIkonu: { fontSize: 18, marginRight: 8 },
    aramaInput: { flex: 1, height: '100%', color: '#333', fontSize: 14 },
    aramaTemizleIkonu: { fontSize: 14, color: '#999', marginLeft: 8 },

    rozetContainer: { position: 'absolute', top: -8, right: -8, backgroundColor: '#ff3b30', borderRadius: 12, minWidth: 24, height: 24, justifyContent: 'center', alignItems: 'center', zIndex: 10, paddingHorizontal: 6, borderWidth: 2, borderColor: '#e3f2fd' },
    rozetYazi: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    // --- KARANLIK MOD (DARK MODE) STİLLERİ ---
    containerDark: { backgroundColor: '#121212' },
    kutuDark: { backgroundColor: '#1e1e1e', shadowOpacity: 0 },
    textDark: { color: '#ffffff' },
    textMutedDark: { color: '#aaaaaa' },
    cizgiDark: { borderColor: '#333333' },
    ayarAlaniDark: { backgroundColor: '#2c2c2c' }
});