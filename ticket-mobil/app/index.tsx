import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function App() {
    const [eposta, setEposta] = useState('');
    const [sifre, setSifre] = useState('');
    const router = useRouter();

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
    },
    butonYazi: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});