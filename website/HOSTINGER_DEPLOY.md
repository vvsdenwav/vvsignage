# Signage Landing Page — Hostinger Shared Hosting Deployment Guide
**Subdomain:** `signage.vvstechnologies.bz`

This folder (`website/`) is a 100% self-contained, lightweight static HTML5, CSS, vanilla JavaScript, and PHP mailer package ready to deploy to Hostinger shared hosting.

---

## 📁 Files Included

- `index.html` — Complete, accessible semantic HTML5 landing page.
- `css/styles.css` — Full CSS design system with variables, 8px grid, responsive breakpoints.
- `js/main.js` — Interactive quote estimator, currency switcher, form logic.
- `contact.php` — **PHPMailer SMTP mailer** sending authenticated emails to `info@vvstechnologies.bz`.
- `phpmailer/` — Bundled PHPMailer library (`PHPMailer.php`, `SMTP.php`, `Exception.php`). No Composer required.
- `images/` — Logo and favicon assets.

---

## 🔐 Step 0: Configure SMTP (One-Time Setup — REQUIRED)

> Before uploading, open `contact.php` and edit the **SMTP CONFIG** block at the top of the file.

```php
define('SMTP_HOST',       'smtp.hostinger.com');
define('SMTP_PORT',       465);
define('SMTP_ENCRYPTION', 'ssl');
define('SMTP_USER',       'info@vvstechnologies.bz');
define('SMTP_PASS',       'YOUR_EMAIL_PASSWORD_HERE'); // ← change this
define('SMTP_FROM_NAME',  'VVS Signage Belize');
define('RECIPIENT_EMAIL', 'info@vvstechnologies.bz');
```

**Where to find your SMTP password:**  
Hostinger hPanel → **Email** → **Email Accounts** → click the account → **Configure Mail Client**.  
The password is the one you set when you *created* the `info@vvstechnologies.bz` email account.

---

## 🚀 Step-by-Step Deployment

### Step 1: Create the Subdomain in Hostinger hPanel
1. Log into **Hostinger hPanel** (`https://hpanel.hostinger.com`).
2. Navigate to **Domains** > **Subdomains** (under `vvstechnologies.bz`).
3. Enter `signage` → creates `signage.vvstechnologies.bz`.
4. Note the document root (usually `public_html/signage`).
5. Click **Create**.

### Step 2: Upload the Files
Upload the entire contents of `website/` to the subdomain root on Hostinger:

```
public_html/signage/
├── index.html
├── contact.php        ← make sure you edited SMTP_PASS first
├── css/
├── js/
├── images/
└── phpmailer/         ← upload this entire folder
    ├── PHPMailer.php
    ├── SMTP.php
    └── Exception.php
```

Use **File Manager** in hPanel, or FTP/SFTP.

### Step 3: Enable SSL
In hPanel → **SSL** → enable **Let's Encrypt** for `signage.vvstechnologies.bz` (free, auto-renewed).

### Step 4: Test Email Delivery
1. Visit `https://signage.vvstechnologies.bz`.
2. Submit a test inquiry through the demo request form.
3. You should receive a formatted HTML email at `info@vvstechnologies.bz` within seconds.
4. If email fails, check `inquiries_log.txt` in the site root — it logs every submission and any SMTP error message.

---

## 📊 Checking Submissions Without Email

If email is temporarily unavailable, all form submissions are **always logged locally** in two files at the site root:

| File | Format | Use |
|---|---|---|
| `inquiries_log.txt` | Plain text | Quick scan of all leads |
| `inquiries.json` | Structured JSON | Export / audit all entries |

Access via hPanel File Manager.

---

## 📞 Support & Contacts Configured
- **Email Notifications:** `info@vvstechnologies.bz`
- **WhatsApp Direct:** `+501 608-6328` (`https://wa.me/5016086328`)
