import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TypeScript için bilet veri yapısını tanımlıyoruz
interface Bilet {
    id: number;
    konu: string;
    detay: string;
    durum: string;
}

export default function SupportScreen() {
    const router = useRouter();
    const [biletler, setBiletler] = useState<Bilet[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);

    // Aşağı çekerek yenileme işlemi için state (durum) ekliyoruz
    const [yenileniyor, setYenileniyor] = useState(false);

    // YENİ: Hangi filtrenin seçili olduğunu tutan state
    const [seciliFiltre, setSeciliFiltre] = useState('Tümü');

    // Çıkış Yapma Fonksiyonu
    const cikisYap = async () => {
        await AsyncStorage.removeItem('kullaniciRol');
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

    // Sayfayı Aşağı Çekince Tetiklenecek Fonksiyon
    const sayfayiYenile = async () => {
        setYenileniyor(true); // Yükleniyor animasyonunu başlat
        await biletleriGetir(); // Verileri sunucudan tekrar çek
        setYenileniyor(false); // Animasyonu durdur
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
                // Listeyi arka planda yenileyerek güncel durumu ekrana yansıtıyoruz
                biletleriGetir();
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Bağlantı Hatası', 'İşlem tamamlanamadı.');
        }
    };

    // Sayfa açıldığında biletleri otomatik olarak yükle
    useEffect(() => {
        biletleriGetir();
    }, []);

    // YENİ: Listeyi render etmeden önce biletleri seçili filtreye göre süzüyoruz
    const filtrelenmisBiletler = biletler.filter(bilet => {
        if (seciliFiltre === 'Tümü') return true;
        return bilet.durum === seciliFiltre;
    });

    return (
        <View style={styles.container}>
            {/* Üst Kısım: Başlık ve Çıkış Butonu */}
            <View style={styles.header}>
                <Text style={styles.baslik}>IT Destek Paneli</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            {/* YENİ: Filtreleme Butonları (Sekmeler) */}
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

            {/* Orta Kısım: Bilet Listesi veya Yükleniyor Göstergesi */}
            {yukleniyor ? (
                <View style={styles.icerik}>
                    <ActivityIndicator size="large" color="#0277bd" />
                </View>
            ) : (
                <FlatList
                    // Artık ana veriyi değil, filtrelenmiş veriyi kullanıyoruz
                    data={filtrelenmisBiletler}
                    keyExtractor={(item) => item.id.toString()}
                    // Pull-to-Refresh özelliğini FlatList'e entegre ediyoruz
                    refreshControl={
                        <RefreshControl
                            refreshing={yenileniyor}
                            onRefresh={sayfayiYenile}
                            colors={['#0277bd']} // Android yüklenme çemberi rengi
                            tintColor="#0277bd" // iOS yüklenme çemberi rengi
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.biletKarti}>
                            <View style={styles.kartUst}>
                                <Text style={styles.konu}>{item.konu}</Text>
                                {/* Duruma göre dinamik renk stili uyguluyoruz */}
                                <Text style={[
                                    styles.durum,
                                    item.durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik
                                ]}>
                                    {item.durum}
                                </Text>
                            </View>
                            <Text style={styles.detay}>{item.detay}</Text>

                            {/* Eğer bilet "Açık" ise Çözüldü Butonunu Göster */}
                            {item.durum !== 'Çözüldü' && (
                                <TouchableOpacity
                                    style={styles.aksiyonButon}
                                    onPress={() => biletCozulduIsaretle(item.id)}
                                >
                                    <Text style={styles.aksiyonButonYazi}>✓ Çözüldü Olarak İşaretle</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
    container: {
        flex: 1,
        backgroundColor: '#e3f2fd',
        padding: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15, // Filtrelerle arası çok açık olmasın diye 15'e çektim
    },
    baslik: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0277bd'
    },
    cikisButon: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    cikisYazi: {
        color: '#fff',
        fontWeight: 'bold',
    },

    // YENİ: Filtreleme Stilleri
    filtreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        backgroundColor: '#fff',
        padding: 5,
        borderRadius: 8,
    },
    filtreButon: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    filtreButonAktif: {
        backgroundColor: '#0277bd',
    },
    filtreYazi: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    filtreYaziAktif: {
        color: '#fff',
    },

    icerik: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    altYazi: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    },
    biletKarti: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    kartUst: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    konu: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2c3e50',
        flex: 1,
    },
    durum: {
        fontSize: 12,
        fontWeight: 'bold',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        overflow: 'hidden',
    },
    durumAcik: {
        color: '#e67e22',
        backgroundColor: '#fdebd0',
    },
    durumCozuldu: {
        color: '#27ae60',
        backgroundColor: '#e9f7ef',
    },
    detay: {
        fontSize: 14,
        color: '#555',
        marginBottom: 10,
    },
    aksiyonButon: {
        backgroundColor: '#4caf50',
        paddingVertical: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 5,
    },
    aksiyonButonYazi: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    }
});