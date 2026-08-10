import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, SafeAreaView, Image, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

interface Mesaj {
    id: number;
    mesaj: string;
    image_url: string | null;
    gonderim_tarihi: string;
    user_id: number;
    isim_soyisim: string;
    role: string;
}

export default function TicketDetailScreen() {
    const { id, konu, detay, durum } = useLocalSearchParams();
    const router = useRouter();

    const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
    const [yeniMesaj, setYeniMesaj] = useState('');
    const [aktifKullaniciId, setAktifKullaniciId] = useState<string | null>(null);
    const [yukleniyor, setYukleniyor] = useState(true);

    const [seciliResim, setSeciliResim] = useState<string | null>(null);

    // YENİ: Tam ekranda gösterilecek resmin yolunu tutan state
    const [tamEkranResim, setTamEkranResim] = useState<string | null>(null);

    useEffect(() => {
        kullaniciIdAlVeMesajlariGetir();
    }, []);

    const kullaniciIdAlVeMesajlariGetir = async () => {
        try {
            const userId = await AsyncStorage.getItem('kullaniciId');
            setAktifKullaniciId(userId);
            await mesajlariCek();
        } catch (error) {
            console.log(error);
        } finally {
            setYukleniyor(false);
        }
    };

    const mesajlariCek = async () => {
        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/get_messages.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ticket_id: id })
            });
            const data = await response.json();

            if (data.durum === 'basarili') {
                setMesajlar(data.mesajlar);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const fotografSec = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert('İzin Gerekli', 'Fotoğraf seçebilmek için galeri erişim izni vermelisiniz.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setSeciliResim(result.assets[0].uri);
        }
    };

    const mesajGonder = async () => {
        if ((yeniMesaj.trim() === '' && !seciliResim) || !aktifKullaniciId) return;

        const formData = new FormData();
        formData.append('ticket_id', id as string);
        formData.append('user_id', aktifKullaniciId);
        formData.append('mesaj', yeniMesaj);

        if (seciliResim) {
            const localUri = seciliResim;
            const filename = localUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('image', { uri: localUri, name: filename, type } as any);
        }

        try {
            const response = await fetch('http://192.168.41.38/staj_projesi/send_message.php', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
                body: formData
            });

            const data = await response.json();

            if (data.durum === 'basarili') {
                setYeniMesaj('');
                setSeciliResim(null);
                mesajlariCek();
            } else {
                Alert.alert('Hata', data.mesaj);
            }
        } catch (error) {
            console.log(error);
            Alert.alert('Bağlantı Hatası', 'Mesaj gönderilemedi.');
        }
    };

    const renderMesaj = ({ item }: { item: Mesaj }) => {
        const benimMesajim = item.user_id.toString() === aktifKullaniciId;
        const resimTamYol = item.image_url ? `http://192.168.41.38/staj_projesi/${item.image_url}` : null;

        return (
            <View style={[styles.mesajSatiri, benimMesajim ? styles.mesajSag : styles.mesajSol]}>
                {!benimMesajim && (
                    <Text style={styles.gonderenIsim}>
                        {item.isim_soyisim} ({item.role === 'support' ? 'IT Destek' : 'Çalışan'})
                    </Text>
                )}
                <View style={[styles.baloncuk, benimMesajim ? styles.baloncukBen : styles.baloncukKarsi]}>

                    {resimTamYol && (
                        // YENİ: Resme tıklanabilirlik özelliği (TouchableOpacity) ekledik
                        <TouchableOpacity onPress={() => setTamEkranResim(resimTamYol)}>
                            <Image
                                source={{ uri: resimTamYol }}
                                style={styles.mesajResmi}
                                resizeMode="cover"
                            />
                        </TouchableOpacity>
                    )}

                    {item.mesaj.trim() !== '' && (
                        <Text style={[styles.mesajMetni, benimMesajim ? styles.metinBen : styles.metinKarsi]}>{item.mesaj}</Text>
                    )}

                    <Text style={styles.tarihMetni}>{item.gonderim_tarihi.substring(11, 16)}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f2f5' }}>

            {/* YENİ: Tam Ekran Fotoğraf Görüntüleyici (Modal) */}
            <Modal
                visible={tamEkranResim !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setTamEkranResim(null)} // Android geri tuşu için
            >
                <View style={styles.modalArkaPlan}>
                    <TouchableOpacity
                        style={styles.modalKapatButon}
                        onPress={() => setTamEkranResim(null)}
                    >
                        <Text style={styles.modalKapatYazi}>✕ Kapat</Text>
                    </TouchableOpacity>

                    {tamEkranResim && (
                        <Image
                            source={{ uri: tamEkranResim }}
                            style={styles.modalResim}
                            resizeMode="contain" // Resmi orantılı şekilde ekrana sığdır
                        />
                    )}
                </View>
            </Modal>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.geriButon}>
                        <Text style={styles.geriYazi}>{"< Geri"}</Text>
                    </TouchableOpacity>
                    <View style={styles.baslikKutusu}>
                        <Text style={styles.konuBaslik} numberOfLines={1}>{konu}</Text>
                        <Text style={[styles.durumBadge, durum === 'Çözüldü' ? styles.durumCozuldu : styles.durumAcik]}>{durum}</Text>
                    </View>
                </View>

                <View style={styles.biletDetayKutusu}>
                    <Text style={styles.detayBaslik}>Sorun Detayı:</Text>
                    <Text style={styles.detayMetin}>{detay}</Text>
                </View>

                {yukleniyor ? (
                    <ActivityIndicator size="large" color="#007bff" style={{ flex: 1 }} />
                ) : (
                    <FlatList
                        data={mesajlar}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderMesaj}
                        contentContainerStyle={styles.sohbetAlani}
                        ListEmptyComponent={
                            <Text style={styles.bosMesaj}>Henüz bir yanıt yok. Buradan iletişime geçebilirsiniz.</Text>
                        }
                        keyboardShouldPersistTaps="handled"
                    />
                )}

                <View style={styles.altGrup}>
                    {seciliResim && (
                        <View style={styles.onizlemeKutusu}>
                            <Image source={{ uri: seciliResim }} style={styles.onizlemeResmi} />
                            <TouchableOpacity style={styles.onizlemeIptal} onPress={() => setSeciliResim(null)}>
                                <Text style={styles.iptalYazi}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputAlani}>
                        <TouchableOpacity style={styles.kameraButon} onPress={fotografSec}>
                            <Text style={styles.kameraYazi}>📷</Text>
                        </TouchableOpacity>

                        <TextInput
                            style={styles.mesajInput}
                            placeholder="Mesajınızı yazın..."
                            value={yeniMesaj}
                            onChangeText={setYeniMesaj}
                            multiline
                        />
                        <TouchableOpacity style={styles.gonderButon} onPress={mesajGonder}>
                            <Text style={styles.gonderYazi}>Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, paddingTop: Platform.OS === 'android' ? 40 : 15, borderBottomWidth: 1, borderColor: '#ddd' },
    geriButon: { marginRight: 15, paddingVertical: 5 },
    geriYazi: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
    baslikKutusu: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    konuBaslik: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
    durumBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
    durumAcik: { backgroundColor: '#fdebd0', color: '#e67e22' },
    durumCozuldu: { backgroundColor: '#e9f7ef', color: '#27ae60' },

    biletDetayKutusu: { backgroundColor: '#fff', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
    detayBaslik: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 4 },
    detayMetin: { fontSize: 14, color: '#444' },

    sohbetAlani: { padding: 15, paddingBottom: 20 },
    bosMesaj: { textAlign: 'center', color: '#999', marginTop: 20 },

    mesajSatiri: { marginBottom: 15, maxWidth: '85%' },
    mesajSol: { alignSelf: 'flex-start' },
    mesajSag: { alignSelf: 'flex-end' },
    gonderenIsim: { fontSize: 11, color: '#888', marginBottom: 4, marginLeft: 4 },
    baloncuk: { padding: 12, borderRadius: 15, minWidth: 100 },
    baloncukBen: { backgroundColor: '#dcf8c6', borderBottomRightRadius: 0 },
    baloncukKarsi: { backgroundColor: '#fff', borderBottomLeftRadius: 0, borderWidth: 1, borderColor: '#e0e0e0' },

    mesajResmi: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },

    mesajMetni: { fontSize: 15 },
    metinBen: { color: '#000' },
    metinKarsi: { color: '#333' },
    tarihMetni: { fontSize: 10, color: '#888', alignSelf: 'flex-end', marginTop: 5 },

    altGrup: { backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },

    onizlemeKutusu: { padding: 10, position: 'relative', alignSelf: 'flex-start' },
    onizlemeResmi: { width: 80, height: 80, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
    onizlemeIptal: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    iptalYazi: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    inputAlani: {
        flexDirection: 'row',
        padding: 10,
        paddingBottom: Platform.OS === 'android' ? 25 : 10,
        alignItems: 'flex-end'
    },
    kameraButon: { paddingVertical: 12, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
    kameraYazi: { fontSize: 24 },

    mesajInput: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
    gonderButon: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, marginLeft: 10, justifyContent: 'center' },
    gonderYazi: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

    // YENİ: Tam ekran modal stilleri
    modalArkaPlan: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    modalKapatButon: { position: 'absolute', top: Platform.OS === 'android' ? 50 : 60, right: 20, zIndex: 1, paddingVertical: 8, paddingHorizontal: 15, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    modalKapatYazi: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    modalResim: { width: '100%', height: '80%' }
});