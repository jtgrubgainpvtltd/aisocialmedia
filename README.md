<div align="center">
  <img src="./frontend/public/branding/logo_full.png" alt="GrubGain Logo" width="300" style="border-radius: 20px;" />
  <h1>GrubGain</h1>
  <p><strong>The Ultimate AI-Powered Digital Marketing Engine for Restaurants</strong></p>
  <p>An enterprise-grade SaaS platform that automates social media marketing, content creation, and audience engagement, empowering restaurant owners to focus on what matters most: the food.</p>
</div>

---

## 🚀 Overview

GrubGain shifts the burden of marketing off the restaurateur's shoulders. By tightly integrating with **OpenAI's gpt-image-1** and **Meta's Graph API**, GrubGain provides an entire marketing agency inside a single dashboard.

From analyzing local festivals to automatically drafting high-converting Facebook and Instagram posts, scheduling them for maximum reach, and actively responding to customer comments—GrubGain handles it all autonomously.

## ✨ Core Features

### 🌆 Real-Time City Feed Intelligence

GrubGain actively analyzes the local environment of the restaurant. It pulls data on the weather, upcoming local sporting events, and cultural festivals to dynamically suggest highly-relevant marketing triggers. E.g., _"It's raining in Mumbai today—promote your hot chocolate and pakoras!"_

### 🤖 AI Content Studio

A state-of-the-art content generation suite:

- **Native Image Generation:** Uses **gpt-image-1** for professional-quality marketing posters with crisp, perfect typography
- **Bilingual Capabilities:** Generates compelling captions simultaneously in English and Hindi
- **Brand Voice Styling:** Instructs the AI to adopt specific tones (Modern, Elegant, Fun, Casual, Professional)
- **Campaign Types:** General Branding, Festival Greetings, Discount Offers, Menu Highlights
- **Automated Hashtags & Emojis:** Leverages advanced parsing to seamlessly embed optimized hashtags
- **High-Quality Output:** Always uses 'high' quality for production-ready marketing assets

### 📅 Smart Scheduling & Predictive Analytics

- **Predictive "Best Time to Post":** analyzes historical engagement metrics directly from the restaurant’s past published posts to highlight the exact hour blocks that yield the most views.
- **Direct Meta Publishing:** Schedule posts natively to Facebook and Instagram without ever leaving the GrubGain dashboard.

### 💬 Auto-Reply AI (Meta Webhook Integration)

- Evaluates incoming comments in real-time
- Automatically classifies comments using GPT-4o-mini as `POSITIVE`, `COMPLAINT`, or `QUESTION`
- Drafts contextual, personalized replies within seconds
- Queue system for 1-click approval and native posting back to Meta

### ✂️ Premium Content Cropping

- Sophisticated front-end canvas cropping tool (`react-easy-crop`)
- Forces images into social-ready aspect ratios: `1:1 (Square)`, `9:16 (Story)`, and `16:9 (Landscape)`
- Real-time preview before publishing

---

## 🛠 Tech Stack

GrubGain is a robust monorepo built using modern, type-safe, and highly-performant technologies:

### **Frontend (Client)**

- **Framework:** React 18 powered by Vite
- **State Management:** `@tanstack/react-query` for high-performance server-state synchronization and caching
- **Routing:** `react-router-dom` with URL state management
- **Styling:** TailwindCSS with custom CSS tokens for glassmorphism UI
- **Components:** `react-easy-crop` for image manipulation, customized animations, and visual dashboards

### **Backend (API Engine)**

- **Runtime:** Node.js + Express.js
- **Database:** PostgreSQL managed by **Prisma ORM**
- **Security:** JWT-based authentication (`jsonwebtoken`), `bcryptjs`, helmet, CORS
- **Logging:** `winston` with structured logging
- **File Handling:** `multer` for uploads
- **Integrations:**
  - `openai` SDK for GPT-4o-mini (captions) and gpt-image-1 (posters)
  - Meta Graph API for Facebook/Instagram publishing
  - Google Business Profile API integration

---

## 📂 Repository Structure

The repository is structured as a standard monorepo:

```text
GrubGain/
├── backend/                     # Express.js REST API
│   ├── api/
│   │   ├── controllers/         # Route logic & request handlers
│   │   ├── jobs/                # Cron schedulers for automated tasks
│   │   ├── middleware/          # JWT Auth, error handlers, rate limiting
│   │   ├── routes/              # Express route definitions
│   │   ├── services/            # OpenAI / Meta API integrations
│   │   └── utils/               # Winston loggers, helpers
│   ├── prisma/                  # Schema and database client
│   │   ├── schema.prisma        # Database schema definition
│   │   └── client.js            # Prisma client instance
│   ├── public/uploads/          # User-generated images (gitignored)
│   ├── server.js                # Application entry point
│   └── .env.example             # Template for environment variables
│
├── frontend/                    # React Vite Client
│   ├── src/
│   │   ├── api/                 # Axios client mapped to backend
│   │   ├── components/          # Reusable UI components
│   │   │   └── AIContentStudio.jsx  # Main content generation interface
│   │   ├── context/             # React Contexts (AuthContext)
│   │   ├── pages/               # View-level layouts
│   │   │   └── dashboard/       # Dashboard pages (History, Analytics, etc.)
│   │   ├── constants/           # Platform configs, tone options
│   │   └── utils/               # Helper functions
│   ├── public/                  # Static assets
│   └── index.html               # HTML entry point
│
└── README.md                    # You are here!
```

---

## 🚀 Getting Started

Follow these steps to run the GrubGain engine locally.

### Prerequisites

- **Node.js:** v18 or higher
- **Database:** PostgreSQL instance (local or cloud)
- **API Keys:**
  - OpenAI API key with gpt-image-1 access
  - Meta Developer App with Graph API permissions
  - (Optional) Google Cloud credentials for Google Business integration

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/grubgain.git
cd grubgain
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Copy the example environment file and configure your keys:

```bash
cp .env.example .env
```

**Required environment variables in `.env`:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/grubgain"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Meta (Facebook/Instagram)
META_APP_ID="your-app-id"
META_APP_SECRET="your-app-secret"
META_WEBHOOK_VERIFY_TOKEN="your-custom-verify-token"

# Google Services
GOOGLE_SERVICES_API_KEY="your-google-api-key"

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

Apply the Prisma schema to your database:

```bash
npx prisma db push
```

(Optional) Seed the database with sample data:

```bash
npx prisma db seed
```

Start the backend server:

```bash
npm run dev
```

_API will launch at `http://localhost:5000`_

### 3. Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
npm install
```

Create frontend `.env` file:

```bash
echo "VITE_API_URL=http://localhost:5000/api/v1" > .env
```

Start the Vite development server:

```bash
npm run dev
```

Visit the application at **`http://localhost:5173`**

---

## 📱 Meta Webhook Setup (for Auto-Reply)

To receive real-time comment notifications from Facebook/Instagram:

1. **Use ngrok to expose your local server:**

   ```bash
   ngrok http 5000
   ```

2. **Configure Meta App Webhook:**
   - Go to [Meta Developers](https://developers.facebook.com)
   - Navigate to your app → Webhooks
   - Add webhook URL: `https://your-ngrok-url.ngrok.io/api/v1/meta/webhook`
   - Verify token: (use the same value as `META_WEBHOOK_VERIFY_TOKEN` in your `.env`)
   - Subscribe to: `feed`, `comments`, `messages`

3. **Test the webhook** by posting a comment on your connected Facebook page

---

## 🔒 Security Best Practices

- ✅ **Never commit `.env` files** — they're already in `.gitignore`
- ✅ **Rotate all API keys** if accidentally exposed
- ✅ **Use HTTPS in production** — the app enforces secure headers via helmet
- ✅ **Rate limiting** — all endpoints are protected (100 req/15min default)
- ✅ **CORS** — only allows requests from `CLIENT_URL` origin
- ✅ **JWT expiry** — tokens expire and must be refreshed

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing Checklist

See `QUICK_REFERENCE.md` for a comprehensive testing guide including:

- Image generation with sharp text
- OAuth flow completion
- Content history navigation
- Scheduling and publishing

---

## 📝 Recent Updates (v2.0)

### Major Improvements

- ✅ **Upgraded to gpt-image-1** for native text rendering (eliminates blurry text issue)
- ✅ **Removed image compositor pipeline** — text now rendered natively by AI
- ✅ **Fixed CORS for image loading** — images now display correctly in dev and prod
- ✅ **Added View & Edit button** — load any history item into Content Studio
- ✅ **Fixed OAuth popup flow** — token now passed correctly via BroadcastChannel
- ✅ **Enhanced security** — added ownership checks to delete operations
- ✅ **Improved route ordering** — static routes before parameterized routes

## 📄 License

This project is proprietary software. All rights reserved.

---

## 💬 Support

For questions, issues, or feature requests:

- 📧 Email: contact@grubgain.com

---

<div align="center">
  <p>Built with ❤️ for restaurant owners who deserve powerful marketing tools</p>
  <p><strong>GrubGain</strong> — Your AI Marketing Partner</p>
</div>
