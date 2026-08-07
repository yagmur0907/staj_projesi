import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function EmployeeScreen() {
    const [konu, setKonu] = useState('');
    const [detay, setDetay] = useState('');
    const router = useRouter();

    // Çıkış Yapma Fonksiyonu (Doğrudan ana sayfaya yönlendirildi)
    const cikisYap = () => {
        router.replace('/');
    };

    // Gerçek Bileti Gönderme Fonksiyonu
    const biletGonder = async () => {
        // 1. Boş alan kontrolü
        if (konu === '' || detay === '') {
            Alert.alert('Eksik Bilgi', 'Lütfen konu ve detay alanlarını doldurun.');
            return;
        }

        try {
            // 2. PHP dosyamıza HTTP POST isteği atıyoruz
            const response = await fetch('http://192.168.41.34/staj_projesi/create_ticket.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                // Formdaki state (durum) verilerimizi JSON string'e çevirip gövdeye (body) ekliyoruz
                body: JSON.stringify({
                    konu: konu,
                    detay: detay
                })
            });

            // 3. PHP'den dönen cevabı JSON olarak okuyoruz
            const data = await response.json();

            // 4. Gelen cevaba göre kullanıcıya mesaj gösteriyoruz
            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', data.mesaj);
                setKonu('');  // Başarılıysa formu temizle
                setDetay('');
            } else {
                Alert.alert('Hata', data.mesaj);
            }

        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. IP adresini kontrol et.');
            console.log(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.baslik}>Yeni Destek Bileti</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

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
        marginBottom: 20,
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
});