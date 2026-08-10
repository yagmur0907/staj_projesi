<?php
// CORS ve JSON formatı için gerekli başlıklar
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Veritabanı bağlantısını içeri aktar
include_once 'baglanti.php';

// React Native'den gelen JSON verisini al ve çöz
$gelen_veri = json_decode(file_get_contents("php://input"));

// Verilerin ve user_id'nin boş olup olmadığını kontrol et
if(
    !empty($gelen_veri->konu) &&
    !empty($gelen_veri->detay) &&
    !empty($gelen_veri->user_id)
) {
    // Güvenlik: XSS ve SQL Injection'dan korunmak için verileri temizle
    $konu = htmlspecialchars(strip_tags($gelen_veri->konu));
    $detay = htmlspecialchars(strip_tags($gelen_veri->detay));
    $user_id = htmlspecialchars(strip_tags($gelen_veri->user_id));
    $durum = "Açık"; // Yeni biletlerin varsayılan durumu

    try {
        // PDO ile veritabanına ekleme sorgusunu hazırla (user_id eklendi)
        $sorgu = "INSERT INTO biletler (konu, detay, durum, user_id) VALUES (:konu, :detay, :durum, :user_id)";
        $stmt = $db->prepare($sorgu);

        // Parametreleri bağla
        $stmt->bindParam(":konu", $konu);
        $stmt->bindParam(":detay", $detay);
        $stmt->bindParam(":durum", $durum);
        $stmt->bindParam(":user_id", $user_id);

        // Sorguyu çalıştır
        if($stmt->execute()) {
            http_response_code(201); // 201: Oluşturuldu
            echo json_encode(array("durum" => "basarili", "mesaj" => "Destek bileti başarıyla iletildi."));
        } else {
            http_response_code(503); // 503: Hizmet Kullanılamıyor
            echo json_encode(array("durum" => "hata", "mesaj" => "Bilet oluşturulurken bir veritabanı hatası oluştu."));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Sistem Hatası: " . $e->getMessage()));
    }
} else {
    // Eksik veri gönderildiyse uyarı ver
    http_response_code(400); // 400: Kötü İstek
    echo json_encode(array("durum" => "hata", "mesaj" => "Lütfen konu, detay ve kullanıcı bilgilerini eksiksiz doldurun."));
}
?>