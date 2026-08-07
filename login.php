<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");

require_once 'baglanti.php';

$gelenVeri = json_decode(file_get_contents("php://input"), true);

if (isset($gelenVeri["eposta"]) && isset($gelenVeri["sifre"])) {

    $eposta = $gelenVeri["eposta"];
    $sifre = $gelenVeri["sifre"];

    try {
        $sorgu = $db->prepare("SELECT id, isim_soyisim, eposta, role, sifre FROM users WHERE eposta = :eposta");
        $sorgu->execute(['eposta' => $eposta]);
        $kullanici = $sorgu->fetch(PDO::FETCH_ASSOC);

        if ($kullanici && $sifre == $kullanici['sifre']) {
            echo json_encode([
                "durum" => "basarili",
                "mesaj" => "Giriş işlemi başarılı.",
                "kullanici" => [
                    "id" => $kullanici["id"],
                    "isim" => $kullanici["isim_soyisim"],
                    "rol" => $kullanici["role"]
                ]
            ]);

        } else {
            // Şifre veya e-posta yanlışsa
            echo json_encode([
                "durum" => "hata",
                "mesaj" => "E-posta adresi veya şifre hatalı!"
            ]);
        }

    } catch (PDOException $e) {
        // Sistemde bir veritabanı hatası oluşursa
        echo json_encode([
            "durum" => "hata",
            "mesaj" => "Sistem hatası: " . $e->getMessage()
        ]);
    }

} else {
    // Eksik veri gönderildiyse
    echo json_encode([
        "durum" => "hata",
        "mesaj" => "Lütfen e-posta ve şifre giriniz."
    ]);
}
?>
