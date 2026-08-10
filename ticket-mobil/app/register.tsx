import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const [isimSoyisim, setIsimSoyisim] = useState('');
    const [eposta, setEposta] = useState('');
    const [sifre, setSifre] = useState('');
    const [role, setRole] = useState('employee'); // Varsayılan olarak çalışan seçili gelsin
    const router = useRouter();

    const kayitOl = async () => {
        if (isimSoyisim === '' || eposta === '' || sifre === '') {
            Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
            return;
        }

        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/register.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isim_soyisim: isimSoyisim,
                    eposta: eposta,
                    sifre: sifre,
                    role: role
                })
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                Alert.alert('Başarılı', data.mesaj, [
                    { text: 'Giriş Yap', onPress: () => router.replace('/') }
                ]);
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
            <Text style={styles.baslik}>Yeni Hesap Oluştur</Text>

            <TextInput
                style={styles.input}
                placeholder="Ad Soyad"
                value={isimSoyisim}
                onChangeText={setIsimSoyisim}
            />

            <TextInput
                style={styles.input}
                placeholder="E-posta Adresi"
                value={eposta}
                onChangeText={setEposta}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Şifre"
                value={sifre}
                onChangeText={setSifre}
                secureTextEntry={true}
            />

            <Text style={styles.label}>Kullanıcı Rolü:</Text>
            <View style={styles.rolContainer}>
                <TouchableOpacity
                    style={[styles.rolButon, role === 'employee' && styles.rolAktif]}
                    onPress={() => setRole('employee')}
                >
                    <Text style={[styles.rolYazi, role === 'employee' && styles.rolYaziAktif]}>Çalışan</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.rolButon, role === 'support' && styles.rolAktif]}
                    onPress={() => setRole('support')}
                >
                    <Text style={[styles.rolYazi, role === 'support' && styles.rolYaziAktif]}>IT Destek</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.buton} onPress={kayitOl}>
                <Text style={styles.butonYazi}>Kayıt Ol</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.geriButon} onPress={() => router.replace('/')}>
                <Text style={styles.geriYazi}>Zaten bir hesabın var mı? Giriş Yap</Text>
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
        marginBottom: 25,
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
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#444',
        marginBottom: 8,
    },
    rolContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 10,
    },
    rolButon: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        alignItems: 'center',
    },
    rolAktif: {
        backgroundColor: '#007bff',
    },
    rolYazi: {
        fontWeight: 'bold',
        color: '#555',
    },
    rolYaziAktif: {
        color: '#fff',
    },
    buton: {
        backgroundColor: '#28a745',
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
    geriButon: {
        alignItems: 'center',
        marginTop: 10,
    },
    geriYazi: {
        color: '#007bff',
        fontWeight: 'bold',
    }
});