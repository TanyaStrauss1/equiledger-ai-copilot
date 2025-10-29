# 🤖 EquiLedger - AI Financial Assistant for SMEs

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/equiledger-ai-copilot)

> **AI-powered financial management for South African small businesses**

EquiLedger is a comprehensive AI financial assistant that helps South African SMEs manage their finances through natural language processing. Create invoices, track expenses, generate reports, and get business insights - all through WhatsApp, Telegram, or web interface.

## ✨ Features

### 🤖 **AI-Powered Financial Services**
- **Natural Language Processing**: "Create invoice for R500 website design for ABC Company"
- **Intent Detection**: Automatically understands financial requests
- **Multi-step Workflows**: Complex financial operations in single commands
- **Business Insights**: AI-generated recommendations and analysis

### 📄 **Invoice Management**
- Create professional invoices with automatic VAT calculations
- Multi-line item support
- Client management
- Payment tracking
- PDF generation ready

### 💰 **Expense Tracking**
- Categorized expense logging
- Receipt upload support
- Automatic VAT calculations
- Expense analysis and insights

### 📊 **Financial Reports**
- Revenue and expense summaries
- VAT compliance reports
- Profit & loss analysis
- Business health insights
- Monthly, quarterly, and yearly reports

### 📱 **Multi-Channel Support**
- **WhatsApp Integration**: Manage finances via WhatsApp
- **Telegram Integration**: Telegram bot support
- **Web Interface**: Professional dashboard
- **Unified Data**: Sync across all platforms

### 💳 **Payment Processing**
- Stripe integration for invoice payments
- Payment intent creation
- Webhook handling
- Payment tracking

### 🔐 **Security & Compliance**
- Multi-tenant data isolation
- Webhook signature verification
- Input validation with Zod
- Audit trails and logging
- South African VAT compliance

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL database
- OpenAI API key
- Twilio account (for WhatsApp)
- Telegram Bot Token
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/equiledger-ai-copilot.git
   cd equiledger-ai-copilot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env.local
   # Edit .env.local with your API keys
   ```

4. **Set up the database**
   ```bash
   pnpm db:generate
   pnpm db:push
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4, Vercel AI SDK
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **Messaging**: Twilio (WhatsApp), Telegram Bot API
- **Deployment**: Vercel

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── webhooks/      # WhatsApp & Telegram webhooks
│   │   ├── invoices/      # Invoice management
│   │   ├── expenses/      # Expense tracking
│   │   ├── reports/       # Financial reports
│   │   └── payments/      # Payment processing
│   ├── dashboard/         # Main dashboard
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── invoice/          # Invoice management UI
│   ├── expense/          # Expense tracking UI
│   └── reports/          # Financial reports UI
├── lib/                  # Core libraries
│   ├── ai/               # AI services
│   ├── db/               # Database schema & connection
│   ├── workflows/        # Custom workflow engine
│   └── auth.ts           # Authentication config
└── drizzle/              # Database migrations
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# AI Services
OPENAI_API_KEY="sk-your_openai_api_key"

# Messaging Services
TWILIO_ACCOUNT_SID="your_twilio_account_sid"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_WHATSAPP_NUMBER="whatsapp:+1234567890"
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"

# Payment Processing
STRIPE_SECRET_KEY="sk_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Authentication
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="https://your-domain.vercel.app"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Webhook Configuration

- **WhatsApp**: `https://your-domain.vercel.app/api/webhooks/whatsapp`
- **Telegram**: `https://your-domain.vercel.app/api/webhooks/telegram`
- **Stripe**: `https://your-domain.vercel.app/api/payments/webhook`

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Set up webhook URLs

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Database Setup

1. **Create PostgreSQL database**
   - Use Vercel Postgres, Supabase, or any PostgreSQL provider

2. **Run migrations**
   ```bash
   pnpm db:push
   ```

## 📖 Usage Examples

### AI Chat Commands

```
"Create invoice for R500 website design for ABC Company"
"Record R450 for transport fuel"
"How much did I make this month?"
"Show me my VAT report for this quarter"
"Analyze my business health"
```

### API Endpoints

- `POST /api/invoices` - Create invoice
- `GET /api/invoices?userId=xxx` - List invoices
- `POST /api/expenses` - Log expense
- `POST /api/reports` - Generate financial report
- `POST /api/webhooks/whatsapp` - WhatsApp webhook
- `POST /api/webhooks/telegram` - Telegram webhook

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [OpenAI](https://openai.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

- 📧 Email: support@equiledger.co.za
- 💬 WhatsApp: +27 61 234 5678
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/equiledger-ai-copilot/issues)

---

**Built with ❤️ for South African SMEs** 🇿🇦