<div align="center">
  <img src="./frontend/public/branding/logo_full.png" alt="GrubGain Logo" width="300" style="border-radius: 20px;" />
  <h1>GrubGain</h1>
  <p><strong>The Ultimate AI-Powered Digital Marketing Engine for Restaurants</strong></p>
  <p>An enterprise-grade SaaS platform that automates social media marketing, content creation, and audience engagement, empowering restaurant owners to focus on what matters most: the food.</p>
</div>

---

## 🚀 Overview

GrubGain shifts the burden of marketing off the restaurateur's shoulders. By tightly integrating with **OpenAI's latest generation models** and **Meta's Graph API**, GrubGain provides an entire marketing agency inside a single dashboard. 

From analyzing local festivals to automatically drafting high-converting Facebook and Instagram posts, scheduling them for maximum reach, and actively responding to customer comments—GrubGain handles it all autonomously.

## ✨ Core Features

### 🌆 Real-Time City Feed Intelligence
GrubGain actively analyzes the local environment of the restaurant. It pulls data on the weather, upcoming local sporting events, and cultural festivals to dynamically suggest highly-relevant marketing triggers. E.g., *"It's raining in Mumbai today—promote your hot chocolate and pakoras!"*

### 🤖 AI Content Studio
A state-of-the-art content generation suite:
- **Bilingual Capabilities:** Generates compelling captions simultaneously in English and Hindi.
- **Brand Voice Styling:** Instructs the AI to adopt specific tones (Playful, Formal, Urgent, Elegant).
- **Automated Hashtags & Emojis:** Leverages advanced parsing to seamlessly embed optimized hashtags.
- **Visual Design:** Uses DALL-E to generate mouth-watering, appetizing promotional graphics.

### 📅 Smart Scheduling & Predictive Analytics
- **Predictive "Best Time to Post":** analyzes historical engagement metrics directly from the restaurant’s past published posts to highlight the exact hour blocks that yield the most views.
- **Direct Meta Publishing:** Schedule posts natively to Facebook and Instagram without ever leaving the GrubGain dashboard.

### 💬 Auto-Reply AI (Meta Webhook Integration)
- Evaluates incoming comments in real-time.
- Automatically classifies comments using GPT-4o-mini as a `POSITIVE` review, `COMPLAINT`, or `QUESTION`.
- Drafts a contextual, personalized reply within seconds and queues it in the dashboard for the business owner to 1-click approve and post natively back to the Meta platform.

### ✂️ Premium Content Cropping
- Includes a sophisticated front-end canvas cropping tool (`react-easy-crop`).
- Forces images into social-ready aspect ratios prior to publishing: `1:1 (Square)`, `4:5 (Portrait)`, and `16:9 (Landscape)`.

---

## 🛠 Tech Stack

GrubGain is a robust monorepo built using modern, type-safe, and highly-performant technologies:

### **Frontend (Client)**
- **Framework:** React 18 powered by Vite.
- **State Management:** `@tanstack/react-query` for high-performance server-state synchronization and caching.
- **Routing:** `react-router-dom` (v7).
- **Styling:** TailwindCSS intertwined with advanced Vanilla CSS tokens for a stunning, responsive, dark-mode-first glassmorphism UI.
- **Components:** `react-easy-crop` for image manipulation, customized animations, and visual dashboards.

### **Backend (API Engine)**
- **Runtime:** Node.js + Express.js.
- **Database:** PostgreSQL managed flawlessly by the **Prisma ORM**.
- **Security & Middleware:** JWT-based authentication (`jsonwebtoken`), `bcryptjs`, internal request logging (`winston`), file handling (`multer`), and strict Global Error Boundary routing.
- **Integrations:**
  - `axios-retry` circuit breakers for robust external API calls.
  - `@metacorp/facebook-nodejs-business-sdk` and standard Graph API calls.
  - `openai` SDK for GPT and DALL-E integration.

---

## 📂 Repository Structure

The repository is structured as a standard monorepo:

```text
GrubGain/
├── backend/                  # Express.js REST API
│   ├── api/
│   │   ├── controllers/      # Route logic & payload parsers
│   │   ├── jobs/             # Schedulers (e.g. cron functions)
│   │   ├── middleware/       # JWT Auth and Error handlers
│   │   ├── routes/           # Express Routers
│   │   ├── services/         # OpenAI / Meta API integrations
│   │   └── utils/            # Winston Loggers
│   ├── prisma/               # Schema and Database Migrations
│   └── public/               # Static user-generated uploads
│
├── frontend/                 # React Vite Client
│   ├── src/
│   │   ├── api/              # Axios interface client mapped to backend
│   │   ├── components/       # Reusable UI widgets
│   │   ├── context/          # Global React Contexts (AuthContext)
│   │   ├── pages/            # View-level layouts (DashboardShell)
│   │   └── utils/            # Cropper math and pure functions
│   └── index.html
│
└── README.md                 # You are here!
```

---

## 🚀 Getting Started

Follow these steps to run the GrubGain engine locally.

### Prerequisites
- **Node.js:** v18 or higher.
- **Database:** A running instance of PostgreSQL.
- **API Keys:** You will need valid credentials for the **OpenAI API** and a **Meta Developer App** configured with Graph API and Webhooks.

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```

Copy the example environment file and configure your keys:
```bash
cp .env.example .env
```
Ensure your `.env` contains your `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, and `META_APP_TOKEN`.

Apply the Prisma schema to your PostgreSQL database:
```bash
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```
*(The API will launch at `http://localhost:5000`)*

### 2. Frontend Setup

Open a new terminal session and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Visit the application at `http://localhost:5173`. 

---

## 🔒 Security & Contribution

- **Environment Variables:** Never commit `.env` files to source control. Ensure the included `.gitignore` rules remain untouched.
- **Webhook Exposing:** To test Meta webhooks locally, utilize a tunneling service like `ngrok` to expose your `localhost:5000` port to the internet and input that URL into your Meta App Dashboard.
