<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'baglanti.php';

// Mobil uygulamadan gelen JSON verisini alıyoruz (bilet id'si gelecek)
$data = json_decode(file_get_contents("php://input"));

if(isset($data->id)) {
    try {
        // Gelen ID'ye sahip biletin durumunu 'Çözüldü' olarak güncelliyoruz
        $sorgu = "UPDATE biletler SET durum = 'Çözüldü' WHERE id = :id";
        $stmt = $db->prepare($sorgu);

        // Güvenlik için parametreyi bağlıyoruz
        $stmt->bindParam(':id', $data->id);

        if($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("durum" => "basarili", "mesaj" => "Bilet başarıyla çözüldü olarak işaretlendi."));
        } else {
            http_response_code(503);
            echo json_encode(array("durum" => "hata", "mesaj" => "Bilet güncellenemedi."));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("durum" => "hata", "mesaj" => "Eksik veri gönderildi."));
}
?>
