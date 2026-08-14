<?php
function sendExpoNotification($to, $title, $body, $data = []) {
    if (!$to) return false;

    $url = 'https://exp.host/--/api/v2/push/send';
    $postData = [
        'to' => $to,
        'title' => $title,
        'body' => $body,
        'sound' => 'default',
        'data' => $data
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: application/json',
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    return $response;
}
?>
