<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Veritabanı bağlantımızı dahil ediyoruz
include_once 'baglanti.php';

try {
    // LEFT JOIN ile biletleri ve personeli birleştiriyoruz
    // YENİ: Alt sorgu (Subquery) ile okunmamış mesaj sayısını çekiyoruz
    $sorgu = "SELECT 
                b.*, 
                u.isim_soyisim as atanan_kisi_isim,
                (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = b.id AND tm.okundu_mu = 0) as okunmamis_mesaj_sayisi
              FROM biletler b 
              LEFT JOIN users u ON b.assigned_to = u.id 
              ORDER BY b.id DESC";

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