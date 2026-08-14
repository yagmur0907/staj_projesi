<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

include_once 'baglanti.php';
$data = json_decode(file_get_contents("php://input"));

if(isset($data->ticket_id)) {
    try {
        // Bilete ait tüm okunmamış mesajları 'okundu' (1) olarak güncelle
        $sorgu = "UPDATE ticket_messages SET okundu_mu = 1 WHERE ticket_id = :ticket_id";
        $stmt = $db->prepare($sorgu);
        $stmt->bindParam(':ticket_id', $data->ticket_id);

        if($stmt->execute()) {
            echo json_encode(array("durum" => "basarili", "mesaj" => "Mesajlar okundu olarak işaretlendi."));
        } else {
            echo json_encode(array("durum" => "hata", "mesaj" => "Güncelleme yapılamadı."));
        }
    } catch(PDOException $e) {
        echo json_encode(array("durum" => "hata", "mesaj" => "Hata: " . $e->getMessage()));
    }
} else {
    echo json_encode(array("durum" => "hata", "mesaj" => "Eksik bilgi (ticket_id yok)."));
}
?>
<?php