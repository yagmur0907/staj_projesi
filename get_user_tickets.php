<?php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'baglanti.php';

// Mobil uygulamadan gelen JSON verisini alıyoruz
$data = json_decode(file_get_contents("php://input"));

if (isset($data->user_id)) {

    try {

        /*
         * Biletleri getirirken:
         *
         * 1. Biletin tüm bilgilerini (b.*)
         * 2. Atanan IT personelinin adını
         * 3. Okunmamış mesaj sayısını
         * 4. Bu bilete daha önce verilmiş puanı
         *
         * birlikte getiriyoruz.
         */

        $sorgu = "
            SELECT
                b.*,

                /* Bilete atanmış IT personelinin adı */
                u.isim_soyisim AS atanan_kisi_isim,

                /* Okunmamış mesaj sayısı */
                (
                    SELECT COUNT(*)
                    FROM ticket_messages tm
                    WHERE tm.ticket_id = b.id
                      AND tm.okundu_mu = 0
                ) AS okunmamis_mesaj_sayisi,

                /* Bilete verilmiş puan */
                (
                    SELECT tr.rating
                    FROM ticket_ratings tr
                    WHERE tr.ticket_id = b.id
                    LIMIT 1
                ) AS puan

            FROM biletler b

            /* assigned_to üzerinden support kullanıcısını bağlıyoruz */
            LEFT JOIN users u
                ON b.assigned_to = u.id

            /* Sadece giriş yapan çalışanın kendi ticketları */
            WHERE b.user_id = :user_id

            /* En yeni ticketlar üstte */
            ORDER BY b.id DESC
        ";

        $stmt = $db->prepare($sorgu);

        $stmt->bindParam(
            ':user_id',
            $data->user_id,
            PDO::PARAM_INT
        );

        $stmt->execute();

        $biletler = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(
            array(
                "durum" => "basarili",
                "biletler" => $biletler
            ),
            JSON_UNESCAPED_UNICODE
        );

    } catch (PDOException $e) {

        http_response_code(500);

        echo json_encode(
            array(
                "durum" => "hata",
                "mesaj" => "Veritabanı hatası: " . $e->getMessage()
            ),
            JSON_UNESCAPED_UNICODE
        );
    }

} else {

    http_response_code(400);

    echo json_encode(
        array(
            "durum" => "hata",
            "mesaj" => "Kullanıcı ID bulunamadı."
        ),
        JSON_UNESCAPED_UNICODE
    );
}
?>