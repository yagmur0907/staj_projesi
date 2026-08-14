<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

require_once 'baglanti.php';

$data = json_decode(file_get_contents("php://input"));

if(isset($data->user_id)) {
    try {
        // YENİ: LEFT JOIN ile bilgileri çekerken, okunmamış mesaj sayısını da alt sorguyla ekliyoruz
        $sorgu = "SELECT 
                    b.*, 
                    u.isim_soyisim as atanan_kisi_isim,
                    (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = b.id AND tm.okundu_mu = 0) as okunmamis_mesaj_sayisi
                  FROM biletler b 
                  LEFT JOIN users u ON b.assigned_to = u.id 
                  WHERE b.user_id = :user_id 
                  ORDER BY b.id DESC";

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