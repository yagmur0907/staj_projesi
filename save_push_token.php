<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once 'baglanti.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id) && isset($data->token)) {
    try {
        $stmt = $db->prepare("UPDATE users SET push_token = :token WHERE id = :id");
        $stmt->execute([':token' => $data->token, ':id' => $data->user_id]);
        echo json_encode(["durum" => "basarili"]);
    } catch(PDOException $e) {
        echo json_encode(["durum" => "hata", "mesaj" => $e->getMessage()]);
    }
}
?>
