import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
// AsyncStorage paketini projeye dahil ediyoruz
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
    const [eposta, setEposta] = useState('');
    const [sifre, setSifre] = useState('');
    const [yukleniyor, setYukleniyor] = useState(true); // Oturum kontrolü için yüklenme durumu
    const router = useRouter();

    // Uygulama ilk açıldığında hafızayı kontrol et
    useEffect(() => {
        oturumKontrolUygula();
    }, []);

    // Hafızada kayıtlı bir oturum var mı diye bakan fonksiyon
    const oturumKontrolUygula = async () => {
        try {
            const kayitliRol = await AsyncStorage.getItem('kullaniciRol');

            if (kayitliRol === 'employee') {
                router.replace('/employee');
            } else if (kayitliRol === 'support') {
                router.replace('/support');
            } else {
                // Kayıtlı oturum yoksa yüklenme ekranını kapat ve giriş formunu göster
                setYukleniyor(false);
            }
        } catch (error) {
            console.log(error);
            setYukleniyor(false);
        }
    };

    const girisYap = async () => {
        if (eposta === '' || sifre === '') {
            Alert.alert('Uyarı', 'Lütfen e-posta ve şifrenizi girin.');
            return;
        }

        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/login.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eposta: eposta,
                    sifre: sifre
                })
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                // Giriş başarılıysa kullanıcının rolünü ve ID'sini telefonun hafızasına (AsyncStorage) kaydet
                await AsyncStorage.setItem('kullaniciRol', data.kullanici.rol);
                await AsyncStorage.setItem('kullaniciId', data.kullanici.id.toString());

                if (data.kullanici.rol === 'employee') {
                    router.replace('/employee');
                } else if (data.kullanici.rol === 'support') {
                    router.replace('/support');
                }
            } else {
                Alert.alert('Hata', data.mesaj);
            }

        } catch (error) {
            Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamadı. IP adresini ve XAMPP\'ın açık olduğunu kontrol et.');
            console.log(error);
        }
    };

    // Hafıza kontrol edilirken kullanıcıya beyaz ekran yerine dönen bir spinner gösteriyoruz
    if (yukleniyor) {
        return (
            <View style={styles.yukleniyorContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.baslik}>Destek Sistemi</Text>

            <TextInput
                style={styles.input}
                placeholder="E-posta Adresiniz"
                value={eposta}
                onChangeText={setEposta}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifreniz"
                value={sifre}
                onChangeText={setSifre}
                secureTextEntry={true}
            />

            <TouchableOpacity style={styles.buton} onPress={girisYap}>
                <Text style={styles.butonYazi}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.kayitButon} onPress={() => router.push('/register')}>
                <Text style={styles.kayitYazi}>Hesabınız yok mu? Kayıt Olun</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        padding: 20,
    },
    yukleniyorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    baslik: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 30,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    buton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 15,
    },
    butonYazi: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    kayitButon: {
        alignItems: 'center',
        marginTop: 5,
    },
    kayitYazi: {
        color: '#007bff',
        fontWeight: 'bold',
        fontSize: 15,
    },
});