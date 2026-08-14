<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once 'baglanti.php';

// Mobil uygulamadan gelen JSON verisini alıyoruz
$data = json_decode(file_get_contents("php://input"));

/*
Beklenen veriler:
- ticket_id
- user_id
- rating
- comment
*/

if (
    !isset($data->ticket_id) ||
    !isset($data->user_id) ||
    !isset($data->rating)
) {
    http_response_code(400);

    echo json_encode([
        "durum" => "hata",
        "mesaj" => "Eksik veri gönderildi."
    ]);

    exit;
}

$ticketId = (int)$data->ticket_id;
$userId = (int)$data->user_id;
$rating = (int)$data->rating;
$comment = isset($data->comment) ? trim($data->comment) : null;

try {

    // ---------------------------------------------------
    // 1. PUANIN 1-5 ARASINDA OLUP OLMADIĞINI KONTROL ET
    // ---------------------------------------------------
    if ($rating < 1 || $rating > 5) {

        http_response_code(400);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Puan 1 ile 5 arasında olmalıdır."
        ]);

        exit;
    }

    // ---------------------------------------------------
    // 2. TICKET KONTROLÜ
    // ---------------------------------------------------
    // Ticket'ın gerçekten var olup olmadığını ve
    // hangi kullanıcıya ait olduğunu kontrol ediyoruz.
    $ticketSorgu = "
        SELECT id, user_id, durum
        FROM biletler
        WHERE id = :ticket_id
        LIMIT 1
    ";

    $ticketStmt = $db->prepare($ticketSorgu);
    $ticketStmt->bindParam(':ticket_id', $ticketId, PDO::PARAM_INT);
    $ticketStmt->execute();

    $ticket = $ticketStmt->fetch(PDO::FETCH_ASSOC);

    if (!$ticket) {

        http_response_code(404);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Bilet bulunamadı."
        ]);

        exit;
    }

    // ---------------------------------------------------
    // 3. TICKET SAHİPLİĞİ KONTROLÜ
    // ---------------------------------------------------
    // Puan veren kişi bu ticket'ın sahibi olmalı.
    if ((int)$ticket['user_id'] !== $userId) {

        http_response_code(403);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Bu bileti değerlendirme yetkiniz yok."
        ]);

        exit;
    }

    // ---------------------------------------------------
    // 4. TICKET ÇÖZÜLDÜ MÜ?
    // ---------------------------------------------------
    if ($ticket['durum'] !== 'Çözüldü') {

        http_response_code(400);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Yalnızca çözülen biletler değerlendirilebilir."
        ]);

        exit;
    }

    // ---------------------------------------------------
    // 5. DAHA ÖNCE PUAN VERİLMİŞ Mİ?
    // ---------------------------------------------------
    $kontrolSorgu = "
        SELECT id
        FROM ticket_ratings
        WHERE ticket_id = :ticket_id
        LIMIT 1
    ";

    $kontrolStmt = $db->prepare($kontrolSorgu);
    $kontrolStmt->bindParam(':ticket_id', $ticketId, PDO::PARAM_INT);
    $kontrolStmt->execute();

    $mevcutPuan = $kontrolStmt->fetch(PDO::FETCH_ASSOC);

    if ($mevcutPuan) {

        http_response_code(409);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Bu bilet daha önce değerlendirilmiş."
        ]);

        exit;
    }

    // ---------------------------------------------------
    // 6. PUANI VERİTABANINA KAYDET
    // ---------------------------------------------------
    $ekleSorgu = "
        INSERT INTO ticket_ratings
        (
            ticket_id,
            user_id,
            rating,
            comment
        )
        VALUES
        (
            :ticket_id,
            :user_id,
            :rating,
            :comment
        )
    ";

    $ekleStmt = $db->prepare($ekleSorgu);

    $ekleStmt->bindParam(':ticket_id', $ticketId, PDO::PARAM_INT);
    $ekleStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $ekleStmt->bindParam(':rating', $rating, PDO::PARAM_INT);
    $ekleStmt->bindParam(':comment', $comment, PDO::PARAM_STR);

    if ($ekleStmt->execute()) {

        http_response_code(200);

        echo json_encode([
            "durum" => "basarili",
            "mesaj" => "Değerlendirmeniz başarıyla kaydedildi."
        ]);

    } else {

        http_response_code(503);

        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Değerlendirme kaydedilemedi."
        ]);
    }

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "durum" => "hata",
        "mesaj" => "Veritabanı hatası: " . $e->getMessage()
    ]);
}
?>
