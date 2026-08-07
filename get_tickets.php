<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Veritabanı bağlantımızı dahil ediyoruz
include_once 'baglanti.php';

try {
    // Biletleri veritabanından en yeniden eskiye doğru çekiyoruz
    $sorgu = "SELECT * FROM biletler ORDER BY id DESC";
    $stmt = $db->prepare($sorgu);
    $stmt->execute();

    // Tüm sonuçları dizi (array) olarak alıyoruz
    $biletler = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode(array("durum" => "basarili", "biletler" => $biletler));

} catch(PDOException $e) {
    http_response_code(500);
    echo json_encode(array("durum" => "hata", "mesaj" => "Biletler yüklenirken hata oluştu: " . $e->getMessage()));
}
?>
