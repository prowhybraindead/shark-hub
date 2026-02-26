# 🦈 Shark Hub

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Admin_SDK-orange?logo=firebase)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Uploads-blue?logo=cloudinary)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

> **Admin Control Panel (The Pentagon)** — The back-office powerhouse for system administrators to manage End-Users, Merchants, Central Treasury routing, Card Templates, and holistic platform auditing.

## ✨ Enhanced Features

- 🏛️ **Central Treasury Operations:** The core engine linking all apps natively via `.env.local` `TREASURY_UID`. When an Admin generates an upgrade invoice for a Merchant, the payment is securely routed to this Central Treasury wallet, preventing unmapped balances.
- 🔄 **Atomic Refund Engine:** Tier-1 Banking compliant refund flows natively built using Firestore `db.batch()` execution. Triggering a refund immediately pulls exact funds linearly from the Central Treasury and maps them explicitly back to the original payer seamlessly creating an Audit Transaction trail.
- 👥 **Massive CRM Tooling:** Advanced tools managing millions of records. Freeze malicious accounts immediately, edit Tier mappings (forcing `stare-wallet` B2B vs B2C UI switches), force PIN resets securely via hashing arrays, and globally edit profiles.
- 🃏 **Card Studio Ecosystem:** Cloudinary-backed designer allowing Admins to create new 3D Card Templates natively inside the system. They select issuers, upload backgrounds, and instantly push new designs downstream to all `stare-wallet` consumers.
- 💳 **Micro-Targeted Card Control:** Allows Admins to freeze explicit singular templates globally rather than freezing entire users.
- 📊 **Global Macro Analytics:** Massive data aggregation resolving exact platform numbers, total circulated volume, extracted fee totals, and cross-platform transaction arrays.
- 🔔 **Socketed Administrator Feeds:** Powered by Firestore `onSnapshot`. If a merchant pays an invoice from their portal, Admins instantly receive a localized toast and feed entry securely validating the payment.
- 💰 **B2B Billing Control:** Admins explicitly create, approve, and suspend massive upgrades converting Merchants to Pro or Enterprise Tiers.

## 🚀 Detailed Setup Instructions

Follow these steps to run the `shark-hub` Admin Control Panel locally. As the administrative center, this app requires the highest level of access to the shared backend.

### 1. Install Dependencies

Ensure you are in the `shark-hub` directory, then install the Node packages:

```bash
cd shark-hub
npm install
```

### 2. Configure Environment Variables

Copy the provided template to create your local environment file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and configure the following blocks carefully:

- **Firebase Client (`NEXT_PUBLIC_FIREBASE_*`)**: Get these from your Firebase Project Settings > Web App config.
- **Firebase Admin (`FIREBASE_ADMIN_*`)**: **CRITICAL.** Generate a Service Account JSON from Firebase Project Settings > Service Accounts. Extract the `project_id`, `client_email`, and `private_key` (ensure the private key is properly formatted with `\n` newlines). The Pentagon heavily relies on this to mutate global balances, freeze users, and process atomic refunds.
- **Central Treasury (`TREASURY_UID`)**: Must exactly match the UID of the designated Treasury user in Auth. Ensures generated merchant invoices are routed properly.
- **Cloudinary (`NEXT_PUBLIC_CLOUDINARY_*`)**: Required for the Card Studio to upload new 3D card templates directly to the CDN.

### 3. Run the Development Server

Once variables are set, boot the Next.js server:

```bash
npm run dev
```

The app will be available at [http://localhost:3002](http://localhost:3002).

## 📁 Repository Structure

```
app/(admin)/
├── card-studio/     # Cloudinary interconnected Card Template designer
├── crm/
│   ├── merchants/   # Global Merchant iteration & explicit [merchantId] tooling
│   └── users/       # Global End-User iteration & [userId] balance/card/transaction controls
├── dashboard/       # Global platform stats mapping volume and fees
├── notifications/   # Global chronological administrator feed
└── layout.tsx       # Secure sidebar wrapper isolating components
lib/
├── firebase.ts      # Standard SDK bridging
├── firebase-admin.ts# Isolated elevated access handling explicitly Admin functionalities
├── actions/crm.ts   # Massive Server Action file (>400 lines) handling Atomic transactions and Treasury operations
└── utils.ts         # Mapping logic for Typescript boundaries
```

## 🔒 Security Hardening

Security headers are pre-configured explicitly inside `vercel.json` preventing external manipulation:

- `X-Frame-Options: DENY` — Hard halts generalized clickjacking
- `X-Content-Type-Options: nosniff` — Resolves aggressive MIME sniffing vulnerabilities
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📄 License

[MIT](LICENSE) © 2026 Shark Fintech Inc.
