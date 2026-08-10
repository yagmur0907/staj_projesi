<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once 'baglanti.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id)) {
    try {
        $sorgu = "SELECT * FROM biletler WHERE user_id = :user_id ORDER BY id DESC";
        $stmt = $db->prepare($sorgu);
        $stmt->bindParam(':user_id', $data->user_id);
        $stmt->execute();

        $biletler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(array(
            "durum" => "basarili",
            "biletler" => $biletler
        ));
    } catch(PDOException $e) {
        echo json_encode(array("durum" => "hata", "mesaj" => $e->getMessage()));
    }
} else {
    echo json_encode(array("durum" => "hata", "mesaj" => "Kullanıcı ID bulunamadı."));
}
?>
