<?php
/**
 * VVSignage Belize – Hostinger Shared Hosting Contact Form Mailer
 * Sub-branch of VVS Technologies (vvstechnologies.bz)
 *
 * Uses PHPMailer with authenticated SMTP to guarantee delivery.
 * Edit only the ── SMTP CONFIG ── section below with your credentials.
 */

// ─────────────────────────────────────────────────────────────────────────────
// ──  SMTP CONFIG  (EDIT THESE VALUES)  ───────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
//
//  Host: Your Hostinger SMTP host.
//        Usually: smtp.hostinger.com
//        Or check hPanel → Email → Email Accounts → Configure
//
//  Port: 465 with SSL  ←  recommended for Hostinger
//        587 with TLS  ←  alternative
//
//  Username: The FULL email address you send FROM (must exist in Hostinger)
//            e.g.  info@vvstechnologies.bz
//
//  Password: The password for that Hostinger email account
//            (NOT your hPanel login password – the email account password)
//
define('SMTP_HOST',       'smtp.hostinger.com');
define('SMTP_PORT',       465);
define('SMTP_ENCRYPTION', 'ssl');           // 'ssl' for port 465 | 'tls' for port 587
define('SMTP_USER',       'info@vvstechnologies.bz');
define('SMTP_PASS',       'D3stiny.chl03.2013');
define('SMTP_FROM_NAME',  'VVS Signage Belize');
define('RECIPIENT_EMAIL', 'info@vvstechnologies.bz');
// ─────────────────────────────────────────────────────────────────────────────

// Load PHPMailer (bundled locally – no Composer required)
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

// ── HTTP Headers ──────────────────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

// ── Parse Input ───────────────────────────────────────────────────────────────
$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);
if (!$data) {
    $data = $_POST;
}

$name     = filter_var($data['name']     ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$business = filter_var($data['business'] ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$phone    = filter_var($data['phone']    ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$email    = filter_var($data['email']    ?? '', FILTER_SANITIZE_EMAIL);
$location = filter_var($data['location'] ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$plan     = filter_var($data['plan']     ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$screens  = filter_var($data['screens']  ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$message  = filter_var($data['message']  ?? '', FILTER_SANITIZE_FULL_SPECIAL_CHARS);

if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and WhatsApp/Phone are required fields.']);
    exit;
}

// ── Build HTML Email Body ─────────────────────────────────────────────────────
$cleanPhone = preg_replace('/[^0-9+]/', '', $phone);
$subject    = 'New Demo & Quote Inquiry: ' . ($business ? "$business ($name)" : $name);

$emailBody  = "<!DOCTYPE html><html><body style='font-family: Arial, sans-serif; background-color: #E5EFC1; padding: 20px; color: #1D2B2E;'>";
$emailBody .= "<div style='max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #A2D5AB; overflow: hidden;'>";
$emailBody .= "<div style='background: #557B83; padding: 20px; text-align: center; border-bottom: 3px solid #39AEA9;'>";
$emailBody .= "<h2 style='color: #ffffff; margin: 0; font-size: 22px; font-weight: bold;'>Signage &bull; Demo &amp; Quote Inquiry</h2>";
$emailBody .= "<p style='color: #E5EFC1; margin: 4px 0 0 0; font-size: 13px;'>VVS Technologies : Signage</p>";
$emailBody .= "</div>";
$emailBody .= "<div style='padding: 24px;'>";
$emailBody .= "<table style='width: 100%; border-collapse: collapse; font-size: 14px;'>";
$emailBody .= "<tr style='background: #f8fafc;'><td style='padding: 10px; font-weight: bold; width: 160px;'>Contact Name:</td><td style='padding: 10px;'>" . htmlspecialchars($name) . "</td></tr>";
$emailBody .= "<tr><td style='padding: 10px; font-weight: bold;'>Business:</td><td style='padding: 10px;'>" . htmlspecialchars($business ?: 'Not Specified') . "</td></tr>";
$emailBody .= "<tr style='background: #f8fafc;'><td style='padding: 10px; font-weight: bold;'>WhatsApp / Phone:</td><td style='padding: 10px;'><a href='https://wa.me/{$cleanPhone}' style='color: #557B83; font-weight: bold; text-decoration: none;'>" . htmlspecialchars($phone) . " (Open WhatsApp)</a></td></tr>";
$emailBody .= "<tr><td style='padding: 10px; font-weight: bold;'>Email:</td><td style='padding: 10px;'>" . htmlspecialchars($email ?: 'None provided') . "</td></tr>";
$emailBody .= "<tr style='background: #f8fafc;'><td style='padding: 10px; font-weight: bold;'>Location in Belize:</td><td style='padding: 10px; font-weight: bold; color: #1D2B2E;'>" . htmlspecialchars($location) . "</td></tr>";
$emailBody .= "<tr><td style='padding: 10px; font-weight: bold;'>Interested Plan:</td><td style='padding: 10px;'><strong style='color: #557B83;'>" . htmlspecialchars($plan) . "</strong></td></tr>";
$emailBody .= "<tr style='background: #f8fafc;'><td style='padding: 10px; font-weight: bold;'>Number of Screens:</td><td style='padding: 10px;'>" . htmlspecialchars($screens) . "</td></tr>";
$emailBody .= "<tr><td style='padding: 10px; font-weight: bold;'>Message / Notes:</td><td style='padding: 10px;'>" . nl2br(htmlspecialchars($message ?: 'No additional notes provided.')) . "</td></tr>";
$emailBody .= "<tr style='background: #f8fafc;'><td style='padding: 10px; font-weight: bold;'>Submission Time:</td><td style='padding: 10px;'>" . date('Y-m-d H:i:s T') . "</td></tr>";
$emailBody .= "</table></div>";
$emailBody .= "<div style='background: #f1f5f9; padding: 14px; text-align: center; font-size: 12px; color: #64748b;'>";
$emailBody .= "Delivered via SMTP to <strong>info@vvstechnologies.bz</strong> from <a href='https://signage.vvstechnologies.bz' style='color: #557B83;'>signage.vvstechnologies.bz</a>";
$emailBody .= "</div></div></body></html>";

// ── Send via PHPMailer / SMTP ─────────────────────────────────────────────────
$mailSent     = false;
$errorMessage = '';

try {
    $mail = new PHPMailer(true); // true = exceptions enabled

    // Server settings
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_ENCRYPTION;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // Sender & recipient
    $mail->setFrom(SMTP_USER, SMTP_FROM_NAME);
    $mail->addAddress(RECIPIENT_EMAIL, 'VVS Technologies');

    // Reply-To: set to the customer's email so you can reply directly
    if (!empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $mail->addReplyTo($email, $name);
    } else {
        $mail->addReplyTo(RECIPIENT_EMAIL);
    }

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $emailBody;
    $mail->AltBody = "New Demo & Quote Inquiry\n\n"
                   . "Name: $name\n"
                   . "Phone: $phone\n"
                   . "Business: " . ($business ?: 'N/A') . "\n"
                   . "Email: " . ($email ?: 'N/A') . "\n"
                   . "Location: $location\n"
                   . "Plan: $plan\n"
                   . "Screens: $screens\n"
                   . "Message: " . ($message ?: 'None') . "\n"
                   . "Submitted: " . date('Y-m-d H:i:s T');

    $mail->send();
    $mailSent = true;

} catch (Exception $e) {
    $errorMessage = $mail->ErrorInfo;
}

// ── Local Backup Logging ──────────────────────────────────────────────────────
$logEntry = date('Y-m-d H:i:s') . ' | ' . $name . ' | ' . $phone . ' | ' . $business . ' | ' . $plan . ' | ' . ($mailSent ? 'SENT' : 'FAILED: ' . $errorMessage) . "\n";
@file_put_contents(__DIR__ . '/inquiries_log.txt', $logEntry, FILE_APPEND);

$jsonEntry = [
    'timestamp' => date('c'),
    'name'      => $name,
    'phone'     => $phone,
    'email'     => $email,
    'business'  => $business,
    'location'  => $location,
    'plan'      => $plan,
    'screens'   => $screens,
    'message'   => $message,
    'recipient' => RECIPIENT_EMAIL,
    'mailSent'  => (bool)$mailSent,
    'error'     => $errorMessage ?: null,
];
$existingLog = @file_exists(__DIR__ . '/inquiries.json') ? @json_decode(@file_get_contents(__DIR__ . '/inquiries.json'), true) : [];
if (!is_array($existingLog)) $existingLog = [];
$existingLog[] = $jsonEntry;
@file_put_contents(__DIR__ . '/inquiries.json', json_encode($existingLog, JSON_PRETTY_PRINT));

// ── Response ──────────────────────────────────────────────────────────────────
if ($mailSent) {
    echo json_encode([
        'success'   => true,
        'mailSent'  => true,
        'recipient' => RECIPIENT_EMAIL,
        'message'   => 'Thank you! Your demo request has been sent. Our technician will reach out on WhatsApp shortly.',
    ]);
} else {
    // SMTP failed – still log it and return success to user so they're not frustrated.
    // Check inquiries_log.txt or inquiries.json on the server for the error detail.
    http_response_code(500);
    echo json_encode([
        'success'  => false,
        'mailSent' => false,
        'error'    => 'Mail could not be delivered. Submission logged locally.',
        'debug'    => $errorMessage,
    ]);
}
?>
