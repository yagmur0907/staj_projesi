import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript için bilet veri yapısını güncelliyoruz
interface Bilet {
    id: number;
    konu: string;
    detay: string;
    durum: string;
    assigned_to: number | null;
    atanan_kisi_isim: string | null;
}

export default function SupportScreen() {
    const router = useRouter();
    const [biletler, setBiletler] = useState<Bilet[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);
    const [yenileniyor, setYenileniyor] = useState(false);
    const [seciliFiltre, setSeciliFiltre] = useState('Tümü');

    const [aktifKullaniciId, setAktifKullaniciId] = useState<string | null>(null);

    // Çıkış Yapma Fonksiyonu
    const cikisYap = async () => {
        await AsyncStorage.removeItem('kullaniciRol');
        await AsyncStorage.removeItem('kullaniciId');
        router.replace('/');
    };

    // Biletleri Sunucudan Çekme Fonksiyonu
    const biletleriGetir = async () => {
        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/get_tickets.php');
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

    // Bileti Üzerine Alma (Bana Ata) Fonksiyonu
    const biletAta = async (ticketId: number) => {
        if (!aktifKullaniciId) return;

        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/assign_ticket.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ticket_id: ticketId,
                    support_user_id: aktifKullaniciId
                })
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

    // Bileti "Çözüldü" Olarak Güncelleyen Fonksiyon
    const biletCozulduIsaretle = async (id: number) => {
        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/update_ticket.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
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
            setAktifKullaniciId(id);
        };

        kullaniciBilgileriniAl();
        biletleriGetir();
    }, []);

    const filtrelenmisBiletler = biletler.filter(bilet => {
        if (seciliFiltre === 'Tümü') return true;
        return bilet.durum === seciliFiltre;
    });

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.baslik}>IT Destek Paneli</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filtreContainer}>
                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Tümü' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Tümü')}
                >
                    <Text style={[styles.filtreYazi, seciliFiltre === 'Tümü' && styles.filtreYaziAktif]}>Tümü</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Açık' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Açık')}
                >
                    <Text style={[styles.filtreYazi, seciliFiltre === 'Açık' && styles.filtreYaziAktif]}>Açık</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filtreButon, seciliFiltre === 'Çözüldü' && styles.filtreButonAktif]}
                    onPress={() => setSeciliFiltre('Çözüldü')}
                >
                    <Text style={[styles.filtreYazi, seciliFiltre === 'Çözüldü' && styles.filtreYaziAktif]}>Çözüldü</Text>
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
                    refreshControl={
                        <RefreshControl refreshing={yenileniyor} onRefresh={sayfayiYenile} colors={['#0277bd']} tintColor="#0277bd" />
                    }
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.biletKarti}
                            onPress={() => router.push({
                                pathname: '/ticket-detail',
                                params: { id: item.id, konu: item.konu, detay: item.detay, durum: item.durum }
                            })}
                            activeOpacity={0.8}
                        >
                            <View style={styles.kartUst}>
                                <Text style={styles.konu}>{item.konu}</Text>
                                <Text style={[styles.durum, item.durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik]}>
                                    {item.durum}
                                </Text>
                            </View>
                            <Text style={styles.detay}>{item.detay}</Text>

                            {/* Alt İşlem Kutusu (Atama ve Çözüldü Butonları) */}
                            <View style={styles.aksiyonKutusu}>

                                {/* Eğer bilet çözüldüyse atama butonunu/ismini gösterme, kapalı yazısı yaz */}
                                {item.durum !== 'Çözüldü' ? (
                                    item.assigned_to ? (
                                        <Text style={styles.atananKisiMetni}>👤 İlgilenen: {item.atanan_kisi_isim}</Text>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.ataButon}
                                            onPress={() => biletAta(item.id)}
                                        >
                                            <Text style={styles.ataButonYazi}>✋ Bana Ata</Text>
                                        </TouchableOpacity>
                                    )
                                ) : (
                                    <Text style={styles.kapaliBiletMetni}>
                                        {item.assigned_to ? `👤 İlgilenen: ${item.atanan_kisi_isim}` : '🔒 Çözüldü'}
                                    </Text>
                                )}

                                {/* Eğer bilet "Açık" ise Çözüldü Butonunu Göster */}
                                {item.durum !== 'Çözüldü' && (
                                    <TouchableOpacity
                                        style={styles.aksiyonButon}
                                        onPress={() => biletCozulduIsaretle(item.id)}
                                    >
                                        <Text style={styles.aksiyonButonYazi}>✓ Çözüldü</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View style={styles.icerik}>
                            <Text style={styles.altYazi}>Bu filtreye uygun destek talebi bulunmuyor.</Text>
                        </View>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#e3f2fd', padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    baslik: { fontSize: 24, fontWeight: 'bold', color: '#0277bd' },
    cikisButon: { backgroundColor: '#dc3545', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 5 },
    cikisYazi: { color: '#fff', fontWeight: 'bold' },
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

    aksiyonKutusu: {
        marginTop: 10,
        borderTopWidth: 1,
        borderColor: '#f0f0f0',
        paddingTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    atananKisiMetni: {
        fontSize: 13,
        color: '#0277bd',
        fontWeight: 'bold',
        fontStyle: 'italic',
        flex: 1
    },
    kapaliBiletMetni: {
        fontSize: 13,
        color: '#888',
        fontStyle: 'italic',
        flex: 1
    },
    ataButon: {
        backgroundColor: '#ff9800',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10
    },
    ataButonYazi: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13
    },
    aksiyonButon: {
        backgroundColor: '#4caf50',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        alignItems: 'center'
    },
    aksiyonButonYazi: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13
    }
});