import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
    const router = useRouter();

    // Çıkış Yapma Fonksiyonu (Doğrudan ana sayfaya yönlendirildi)
    const cikisYap = () => {
        router.replace('/');
    };

    return (
        <View style={styles.container}>
            {/* Üst Kısım: Başlık ve Çıkış Butonu */}
            <View style={styles.header}>
                <Text style={styles.baslik}>IT Destek Paneli</Text>
                <TouchableOpacity onPress={cikisYap} style={styles.cikisButon}>
                    <Text style={styles.cikisYazi}>Çıkış</Text>
                </TouchableOpacity>
            </View>

            {/* Orta Kısım: İçerik */}
            <View style={styles.icerik}>
                <Text style={styles.altYazi}>Burada gelen arıza taleplerini göreceksin.</Text>
            </View>
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
    },
    altYazi: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center'
    }
});