import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

// TypeScript için bilet veri yapısını tanımlıyoruz
interface Bilet {
    id: number;
    konu: string;
    detay: string;
    durum: string;
}

export default function EmployeeScreen() {
    const [konu, setKonu] = useState('');
    const [detay, setDetay] = useState('');

    // Geçmiş bilet listesi için stateler
    const [biletler, setBiletler] = useState<Bilet[]>([]);
    const [yukleniyor, setYukleniyor] = useState(true);

    const router = useRouter();

    // Çıkış Yapma Fonksiyonu
    const cikisYap = () => {
        router.replace('/');
    };

    // Biletleri veritabanından çekme fonksiyonu
    const biletleriGetir = async () => {
        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/get_tickets.php');
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

    // Sayfa açıldığında biletleri yükle
    useEffect(() => {
        biletleriGetir();
    }, []);

    // Gerçek Bileti Gönderme Fonksiyonu
    const biletGonder = async () => {
        if (konu === '' || detay === '') {
            Alert.alert('Eksik Bilgi', 'Lütfen konu ve detay alanlarını doldurun.');
            return;
        }

        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/create_ticket.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    konu: konu,
                    detay: detay
                })
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', data.mesaj);
                setKonu('');
                setDetay('');
                // Bilet gönderildikten sonra listeyi anında yenile!
                biletleriGetir();
            } else {
                Alert.alert('Hata', data.mesaj);
            }

        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. IP adresini kontrol et.');
            console.log(error);
        }
    };

    // Form alanını FlatList'in başlığı (Header) olarak render ediyoruz
    const FormAlaniniOlustur = () => (
        <View style={styles.formContainer}>
            <Text style={styles.bilgiYazisi}>
                Lütfen yaşadığınız sorunu kısaca özetleyin. IT ekibimiz en kısa sürede ilgilenecektir.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Sorunun Konusu (Örn: İnternet Kesintisi)"
                value={konu}
                onChangeText={setKonu}
            />

            <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Lütfen sorunu detaylıca açıklayın..."
                value={detay}
                onChangeText={setDetay}
                multiline={true}
                numberOfLines={4}
            />

            <TouchableOpacity style={styles.gonderButon} onPress={biletGonder}>
                <Text style={styles.gonderYazi}>Bileti Gönder</Text>
            </TouchableOpacity>

            <View style={styles.ayiriciCizgi} />
            <Text style={styles.gecmisBaslik}>Geçmiş Taleplerim</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.baslik}>Yeni Destek Bileti</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            {/* İçerik Yükleniyorsa Spinner Göster, Yüklendiyse Listeyi Göster */}
            {yukleniyor ? (
                <ActivityIndicator size="large" color="#28a745" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={biletler}
                    keyExtractor={(item) => item.id.toString()}
                    ListHeaderComponent={FormAlaniniOlustur}
                    renderItem={({ item }) => (
                        <View style={styles.biletKarti}>
                            <View style={styles.kartUst}>
                                <Text style={styles.biletKonu}>{item.konu}</Text>
                                <Text style={[
                                    styles.durum,
                                    item.durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik
                                ]}>
                                    {item.durum}
                                </Text>
                            </View>
                            <Text style={styles.biletDetay}>{item.detay}</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text style={styles.altYazi}>Henüz bir destek talebi oluşturmadınız.</Text>
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    baslik: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
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
    formContainer: {
        marginBottom: 10,
    },
    bilgiYazisi: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    gonderButon: {
        backgroundColor: '#28a745',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    gonderYazi: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    ayiriciCizgi: {
        height: 1,
        backgroundColor: '#ddd',
        marginVertical: 20,
    },
    gecmisBaslik: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    biletKarti: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    kartUst: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    biletKonu: {
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
    biletDetay: {
        fontSize: 14,
        color: '#666',
    },
    altYazi: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
    }
});