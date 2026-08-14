<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
include_once 'baglanti.php';

$target_dir = "uploads/";
if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$user_id = $_POST['user_id'] ?? null;

if ($user_id && isset($_FILES['image'])) {
    $filename = time() . "_" . basename($_FILES["image"]["name"]);
    $target_file = $target_dir . $filename;

    if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
        $stmt = $db->prepare("UPDATE users SET profile_image = :image WHERE id = :id");
        $stmt->execute([':image' => $target_file, ':id' => $user_id]);

        echo json_encode(["durum" => "basarili", "path" => $target_file]);
    } else {
        echo json_encode(["durum" => "hata", "mesaj" => "Dosya yüklenemedi."]);
    }
} else {
    echo json_encode(["durum" => "hata", "mesaj" => "Eksik parametre."]);
}
?>