<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Veritabanı bağlantısını doğrudan dosya içine tanımlıyoruz (Include hatasını tamamen kesmek için)
$sunucu = "localhost";
$veritabani = "ticket_sistemi_db";
$kullanici = "root";
$sifre = "";

try {
    $db = new PDO("mysql:host=$sunucu;dbname=$veritabani;charset=utf8", $kullanici, $sifre);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı bağlantı hatası: " . $e->getMessage()));
    exit();
}

// Mobil uygulamadan gelen JSON verisini alıyoruz
$data = json_decode(file_get_contents("php://input"));

if(isset($data->isim_soyisim) && isset($data->eposta) && isset($data->sifre) && isset($data->role)) {
    try {
        // Bu e-posta adresiyle daha önce kayıt olunmuş mu kontrol et
        $kontrolSorgu = "SELECT id FROM users WHERE eposta = :eposta LIMIT 1";

        $kontrolStmt = $db->prepare($kontrolSorgu);
        $kontrolStmt->bindParam(':eposta', $data->eposta);
        $kontrolStmt->execute();

        if($kontrolStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(array("durum" => "hata", "mesaj" => "Bu e-posta adresi zaten sistemde kayıtlı."));
        } else {
            // Yeni kullanıcıyı veritabanına ekle
            $sorgu = "INSERT INTO users (isim_soyisim, eposta, sifre, role) VALUES (:isim_soyisim, :eposta, :sifre, :role)";
            $stmt = $db->prepare($sorgu);

            $stmt->bindParam(':isim_soyisim', $data->isim_soyisim);
            $stmt->bindParam(':eposta', $data->eposta);
            $stmt->bindParam(':sifre', $data->sifre);
            $stmt->bindParam(':role', $data->role);

            if($stmt->execute()) {
                http_response_code(200);
                echo json_encode(array("durum" => "basarili", "mesaj" => "Kayıt işlemi başarıyla tamamlandı."));
            } else {
                http_response_code(503);
                echo json_encode(array("durum" => "hata", "mesaj" => "Kayıt oluşturulamadı."));
            }
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("durum" => "hata", "mesaj" => "Lütfen tüm alanları doldurun."));
}
?>