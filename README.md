# 🦈 Shark Hub

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Admin_SDK-orange?logo=firebase)
![Cloudinary](https://img.shields.io/badge/Cloudinary-Uploads-blue?logo=cloudinary)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

> **Admin Control Panel (The Pentagon)** — The back-office dashboard for system administrators to manage users, merchants, transactions, card templates, and platform analytics.

## ✨ Features

- 👥 **CRM Dashboard** — User & Merchant management with freeze, tier changes, PIN reset, and profile editing
- 🃏 **Card Studio** — Design card templates with Cloudinary image uploads, issuer selection, and live preview
- 💳 **Admin Card Control** — Lock/unlock individual user cards for fraud prevention
- 📊 **Global Analytics** — Platform-wide stats: total users, revenue, transaction volume
- 🔔 **Real-time Notifications** — Firebase `onSnapshot` powered admin notification feed
- 🏷️ **Transaction Categories** — Full category visibility (Food, Shopping, Transport, etc.) in the transaction ledger
- 💰 **Invoice Management** — Create upgrade invoices, approve payments, manage merchant billing
- 🔄 **Refund Engine** — Tier-1 Banking compliant refund flows with admin accountability

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in Firebase & Cloudinary credentials
npm run dev
```

The app runs on [http://localhost:3002](http://localhost:3002).

## 📁 Project Structure

```
app/(admin)/
├── dashboard/       # Global stats & overview
├── crm/
│   ├── users/       # User list & [id] detail (cards, transactions)
│   └── merchants/   # Merchant list & [id] detail (invoices, plans)
├── card-studio/     # Card template designer
├── notifications/   # Admin notification feed
└── layout.tsx       # Admin sidebar layout
lib/
├── firebase.ts      # Client SDK
├── firebase-admin.ts # Admin SDK
├── actions/crm.ts   # All CRM server actions
└── utils.ts         # formatCurrency, getCategoryLabel, etc.
```

## 🔒 Deployment (Vercel)

Security headers are pre-configured in `vercel.json`:
- `X-Frame-Options: DENY` — Prevents clickjacking
- `X-Content-Type-Options: nosniff` — Prevents MIME sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📄 License

[MIT](LICENSE) © 2026 Shark Fintech Inc.
