import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

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

    // Çıkış Yapma Fonksiyonu
    const cikisYap = () => {
        router.replace('/');
    };

    // Biletleri Sunucudan Çekme Fonksiyonu
    const biletleriGetir = async () => {
        try {
            const response = await fetch('http://192.168.41.34/staj_projesi/get_tickets.php');
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

    // Sayfa açıldığında biletleri otomatik olarak yükle
    useEffect(() => {
        biletleriGetir();
    }, []);

    return (
        <View style={styles.container}>
            {/* Üst Kısım: Başlık ve Çıkış Butonu */}
            <View style={styles.header}>
                <Text style={styles.baslik}>IT Destek Paneli</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            {/* Orta Kısım: Bilet Listesi veya Yükleniyor Göstergesi */}
            {yukleniyor ? (
                <View style={styles.icerik}>
                    <ActivityIndicator size="large" color="#0277bd" />
                </View>
            ) : (
                <FlatList
                    data={biletler}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.biletKarti}>
                            <View style={styles.kartUst}>
                                <Text style={styles.konu}>{item.konu}</Text>
                                <Text style={styles.durum}>{item.durum}</Text>
                            </View>
                            <Text style={styles.detay}>{item.detay}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <View style={styles.icerik}>
                            <Text style={styles.altYazi}>Henüz oluşturulmuş destek talebi yok.</Text>
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
        backgroundColor: '#e3f2fd', // Destek paneli için mavi arka plan rengi
        padding: 20,
        paddingTop: 50, // Telefonun üst bildirim çubuğundan biraz aşağı indirdik
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    baslik: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0277bd'
    },
    cikisButon: {
        backgroundColor: '#dc3545', // Kırmızı çıkış butonu
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 5,
    },
    cikisYazi: {
        color: '#fff',
        fontWeight: 'bold',
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
        color: '#e67e22',
        backgroundColor: '#fdebd0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    detay: {
        fontSize: 14,
        color: '#555',
    },
});