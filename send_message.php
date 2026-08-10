<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'baglanti.php';

// Artık veriler JSON değil FormData olarak geldiği için $_POST ve $_FILES kullanıyoruz
$ticket_id = isset($_POST['ticket_id']) ? $_POST['ticket_id'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;
$mesaj = isset($_POST['mesaj']) ? $_POST['mesaj'] : '';

$image_url = null;

if($ticket_id && $user_id) {
    try {
        // Fotoğraf yüklenmiş mi kontrol et
        if(isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';

            // Eğer uploads klasörü yoksa otomatik oluştur
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            // Dosya uzantısını al ve benzersiz bir isim üret (Örn: img_64c1a2b...jpg)
            $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
            $yeniDosyaAdi = uniqid('img_', true) . '.' . $fileExtension;
            $hedefYol = $uploadDir . $yeniDosyaAdi;

            // Dosyayı geçici dizinden uploads klasörüne taşı
            if(move_uploaded_file($_FILES['image']['tmp_name'], $hedefYol)) {
                $image_url = $hedefYol; // Veritabanına kaydedilecek yol
            }
        }

        // Hem mesaj hem de fotoğraf boşsa hata ver (Sadece foto veya sadece mesaj atılabilir)
        if(empty(trim($mesaj)) && $image_url == null) {
            http_response_code(400);
            echo json_encode(array("durum" => "hata", "mesaj" => "Boş mesaj gönderilemez."));
            exit();
        }

        $temiz_mesaj = htmlspecialchars(strip_tags(trim($mesaj)));

        // Veritabanına kaydet (image_url sütunu ile birlikte)
        $sorgu = "INSERT INTO ticket_messages (ticket_id, user_id, mesaj, image_url) VALUES (:ticket_id, :user_id, :mesaj, :image_url)";
        $stmt = $db->prepare($sorgu);

        $stmt->bindParam(':ticket_id', $ticket_id);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->bindParam(':mesaj', $temiz_mesaj);
        $stmt->bindParam(':image_url', $image_url);

        if($stmt->execute()) {
            http_response_code(201);
            echo json_encode(array("durum" => "basarili", "mesaj" => "Mesaj başarıyla gönderildi."));
        } else {
            http_response_code(503);
            echo json_encode(array("durum" => "hata", "mesaj" => "Mesaj kaydedilemedi."));
        }
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(array("durum" => "hata", "mesaj" => "Veritabanı hatası: " . $e->getMessage()));
    }
} else {
    http_response_code(400);
    echo json_encode(array("durum" => "hata", "mesaj" => "Bilet ID veya Kullanıcı ID eksik."));
}
?>