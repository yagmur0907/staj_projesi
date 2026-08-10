<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'baglanti.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->ticket_id) && isset($data->support_user_id)) {
    try {
        // Bileti güncelle: assigned_to sütununa bu işlemi yapan IT personelinin ID'sini yaz
        $sorgu = "UPDATE biletler SET assigned_to = :support_user_id WHERE id = :ticket_id";
        $stmt = $db->prepare($sorgu);

        $stmt->bindParam(':support_user_id', $data->support_user_id);
        $stmt->bindParam(':ticket_id', $data->ticket_id);

        if($stmt->execute()) {
            http_response_code(200);
            echo json_encode(array("durum" => "basarili", "mesaj" => "Bilet başarıyla üzerinize alındı."));
        } else {
            http_response_code(503);
            echo json_encode(array("durum" => "hata", "mesaj" => "Atama işlemi gerçekleştirilemedi."));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("durum" => "hata", "mesaj" => "Bilet ID veya Destek Personeli ID eksik."));
}
?>