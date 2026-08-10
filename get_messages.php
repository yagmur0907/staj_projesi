<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'baglanti.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->ticket_id)) {
    try {
        // Hangi kullanıcının (Çalışan mı Destek mi) gönderdiğini bilmek için users tablosuyla birleştirdik
        $sorgu = "SELECT tm.id, tm.mesaj, tm.image_url, tm.gonderim_tarihi, tm.user_id, u.isim_soyisim, u.role
                  FROM ticket_messages tm
                  JOIN users u ON tm.user_id = u.id 
                  WHERE tm.ticket_id = :ticket_id 
                  ORDER BY tm.gonderim_tarihi ASC";

        $stmt = $db->prepare($sorgu);
        $stmt->bindParam(':ticket_id', $data->ticket_id);
        $stmt->execute();

        $mesajlar = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode(array(
            "durum" => "basarili",
            "mesajlar" => $mesajlar
        ));
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("durum" => "hata", "mesaj" => "Lütfen bir bilet ID'si gönderin."));
}
?>
