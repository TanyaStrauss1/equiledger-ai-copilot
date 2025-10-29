# 🚀 EquiLedger Production Setup Guide

## **Step 1: Database Setup (Supabase)**

### **1.1 Create Supabase Project**
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up/login with GitHub
4. Click "New Project"
5. Choose organization and enter project details:
   - **Name**: `equiledger-ai-copilot`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users (e.g., `ap-southeast-1` for South Africa)

### **1.2 Get Database Credentials**
1. Go to **Settings** → **Database**
2. Copy the **Connection string** (looks like: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`)
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL**: `https://[project-ref].supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role secret key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **1.3 Set Up Database Schema**
```bash
# In your local project directory
cd /Users/tanyastrauss/ai-copilot-nextjs

# Set up environment variables locally first
cp env.template .env.local
# Edit .env.local with your Supabase credentials

# Generate and push database schema
pnpm db:generate
pnpm db:push
```

---

## **Step 2: OpenAI API Setup**

### **2.1 Get OpenAI API Key**
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign up/login
3. Go to **API Keys** section
4. Click **"Create new secret key"**
5. Name it: `EquiLedger Production`
6. Copy the key (starts with `sk-`)

### **2.2 Add Credits**
1. Go to **Billing** → **Usage limits**
2. Add payment method
3. Set usage limits (recommended: $50/month for start)

---

## **Step 3: Twilio WhatsApp Setup**

### **3.1 Create Twilio Account**
1. Go to [https://console.twilio.com](https://console.twilio.com)
2. Sign up for free account
3. Verify your phone number

### **3.2 Get Twilio Credentials**
1. Go to **Console Dashboard**
2. Copy:
   - **Account SID**: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Auth Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### **3.3 Set Up WhatsApp Sandbox**
1. Go to **Messaging** → **Try it out** → **Send a WhatsApp message**
2. Follow instructions to connect your WhatsApp number
3. Note the sandbox number (format: `whatsapp:+14155238886`)

### **3.4 Upgrade to Production (Optional)**
- For production, you'll need to apply for WhatsApp Business API
- For now, sandbox works for testing

---

## **Step 4: Telegram Bot Setup**

### **4.1 Create Telegram Bot**
1. Open Telegram and search for `@BotFather`
2. Start a chat and send `/newbot`
3. Follow instructions:
   - **Bot name**: `EquiLedger AI Assistant`
   - **Username**: `equiledger_ai_bot` (must end with `_bot`)
4. Copy the **Bot Token** (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### **4.2 Set Webhook**
```bash
# Replace YOUR_BOT_TOKEN with your actual token
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/webhooks/telegram"}'
```

---

## **Step 5: Stripe Payment Setup**

### **5.1 Create Stripe Account**
1. Go to [https://stripe.com](https://stripe.com)
2. Sign up for account
3. Complete business verification

### **5.2 Get Stripe Keys**
1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key**: `pk_test_...` (for frontend)
   - **Secret key**: `sk_test_...` (for backend)

### **5.3 Set Up Webhook**
1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/payments/webhook`
4. **Events to send**: Select `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Webhook signing secret**: `whsec_...`

---

## **Step 6: Google OAuth Setup**

### **6.1 Create Google Cloud Project**
1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: `EquiLedger AI Copilot`
3. Enable **Google+ API**

### **6.2 Create OAuth Credentials**
1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: Web application
4. **Name**: `EquiLedger Web Client`
5. **Authorized redirect URIs**:
   - `https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/auth/callback/google`
6. Copy:
   - **Client ID**: `123456789-abc...googleusercontent.com`
   - **Client Secret**: `GOCSPX-abc...`

---

## **Step 7: Vercel Environment Variables**

### **7.1 Add All Variables to Vercel**
1. Go to [https://vercel.com/equi-ledger/ai-copilot-nextjs](https://vercel.com/equi-ledger/ai-copilot-nextjs)
2. Click **Settings** → **Environment Variables**
3. Add each variable:

```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Services
OPENAI_API_KEY=sk-your_openai_api_key

# Messaging Services
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Authentication
NEXTAUTH_SECRET=your_random_secret_string_here
NEXTAUTH_URL=https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app
GOOGLE_CLIENT_ID=123456789-abc...googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc...

# Public Variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
NEXT_PUBLIC_APP_URL=https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app
```

### **7.2 Generate NEXTAUTH_SECRET**
```bash
# Generate a random secret
openssl rand -base64 32
```

---

## **Step 8: Test Your Setup**

### **8.1 Redeploy**
1. After adding all environment variables, Vercel will auto-redeploy
2. Or manually trigger redeploy from dashboard

### **8.2 Test Endpoints**
```bash
# Test health endpoint
curl https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/health

# Test webhook endpoints
curl -X POST https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/webhooks/whatsapp
curl -X POST https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app/api/webhooks/telegram
```

### **8.3 Test Features**
1. **Landing Page**: Visit your production URL
2. **Dashboard**: Go to `/dashboard`
3. **AI Chat**: Try creating an invoice
4. **WhatsApp**: Send message to your Twilio sandbox number
5. **Telegram**: Send message to your bot

---

## **🎯 Quick Start Checklist**

- [ ] Supabase project created and database schema pushed
- [ ] OpenAI API key obtained and credits added
- [ ] Twilio account set up with WhatsApp sandbox
- [ ] Telegram bot created and webhook set
- [ ] Stripe account created with webhook configured
- [ ] Google OAuth credentials created
- [ ] All environment variables added to Vercel
- [ ] Production app tested and working

---

## **🚨 Important Notes**

1. **Start with Test/Sandbox**: Use test keys and sandbox environments first
2. **Security**: Never commit real API keys to Git
3. **Monitoring**: Set up error tracking (Sentry) for production
4. **Backups**: Enable database backups in Supabase
5. **Scaling**: Monitor usage and upgrade plans as needed

---

## **📞 Support**

If you need help with any step:
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **OpenAI**: [platform.openai.com/docs](https://platform.openai.com/docs)
- **Twilio**: [twilio.com/docs](https://twilio.com/docs)
- **Telegram**: [core.telegram.org/bots](https://core.telegram.org/bots)
- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

**Your AI financial assistant will be live and helping South African SMEs! 🇿🇦**
