# 📊 Fashion 1972NE – Business Analytics Dashboard

A modern business analytics dashboard built using **Next.js**, **React**, **TypeScript**, **Tailwind CSS**, and **Supabase** to provide real-time sales insights, channel performance, product analytics, and executive reporting.

> Designed for internal business intelligence and decision-making with a clean, responsive, and professional user interface.

---

## 🚀 Features

### 📈 Sales Analytics
- Today Sales
- Yesterday Sales
- Week-to-Date (WTD)
- Month-to-Date (MTD)
- Year-to-Date (YTD)
- Run Rate Analysis
- Target vs Achievement
- Week-over-Week Comparison
- Month-over-Month Comparison

### 🛒 Marketplace Analysis
- Amazon
- Shopify
- Myntra
- Flipkart
- Nykaa
- FirstCry
- B2B
- Offline Sales

### 🏷 Brand Analytics
- Cocoon Care
- The Boo Boo Club
- Brand Contribution
- Brand Sales Trend

### 📦 Product Analytics
- SKU Performance
- Category Analysis
- Pack Of & Piece Of Analysis
- Quantity Sold
- Revenue
- Top Selling Products

### 📊 Interactive Dashboard
- Responsive Design
- Dark / Light Theme
- Interactive Charts
- KPI Cards
- Sales Trend Analysis
- Executive Summary
- Quick Insights

### 📅 Date Intelligence
- Custom "As Of" Date
- Daily Comparison
- Weekly Comparison
- Monthly Comparison
- Dynamic Time Intelligence

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Frontend Framework |
| React | UI Components |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Supabase | Database & Backend |
| PostgreSQL | Data Storage |
| Recharts | Data Visualization |
| Lucide React | Icons |
| Vercel | Deployment |

---

## 📂 Project Structure

```
src/
│
├── app/
├── components/
│   ├── charts/
│   ├── dashboard/
│   ├── layout/
│   ├── tables/
│   └── ui/
│
├── lib/
│
├── hooks/
│
├── styles/
│
└── types/
```

---

## 📊 Dashboard Modules

- Home
- Sales Overview
- Channel Performance
- Brand Performance
- Product Analytics
- Inventory
- Reports
- Settings

---

## 📈 Key Metrics

- Revenue
- Orders
- Quantity Sold
- Average Order Value
- Run Rate
- Growth %
- Target Achievement
- Marketplace Share
- Brand Contribution
- Top Products

---

## 🔄 Data Flow

```
OMS API
     │
     ▼
Python Data Pipeline
     │
     ▼
Supabase Database
     │
     ▼
Next.js Dashboard
     │
     ▼
Vercel Deployment
```

---

## 💻 Getting Started

### Clone Repository

```bash
git clone https://github.com/<your-username>/Web-dashboard.git
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Run Development Server

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

## 🚀 Deployment

The application is optimized for deployment on **Vercel**.

```bash
npm run build
```

Deploy directly from GitHub for automatic CI/CD.

---

## 🎯 Roadmap

- [x] Sales Dashboard
- [x] Marketplace Analytics
- [x] Brand Analytics
- [x] Product Dashboard
- [x] Responsive Design
- [ ] Inventory Module
- [ ] AI Insights
- [ ] Forecasting
- [ ] User Authentication
- [ ] Export Reports
- [ ] Notification Center

---

## 📸 Screenshots

_Add dashboard screenshots here._

---

## 📄 License

This project is developed for **Fashion 1972NE** and is intended for internal business analytics and reporting.

---

## 👨‍💻 Author

**Fashion 1972NE Analytics Team**

Built with ❤️ using Next.js, React, TypeScript, Supabase and Tailwind CSS.
