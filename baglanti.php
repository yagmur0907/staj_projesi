<?php
$sunucu = "localhost";
$veritabani = "ticket_sistemi_db";
$kullanici = "root";
$sifre = "";
try {
    $db = new PDO("mysql:host=$sunucu;dbname=$veritabani;charset=utf8", $kullanici, $sifre);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    echo "Veritabanı bağlantı hatası: " . $e->getMessage();
    die();
}
?>