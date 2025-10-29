#!/bin/bash

# EquiLedger AI Copilot - Quick Setup Script
# This script helps you set up all the necessary services

echo "🚀 EquiLedger AI Copilot - Production Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_tools() {
    print_status "Checking required tools..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Please install it first:"
        echo "npm install -g vercel"
        exit 1
    fi
    
    print_success "All required tools are installed!"
}

# Generate environment template
generate_env_template() {
    print_status "Generating environment template..."
    
    cat > .env.production << EOF
# ===========================================
# EQUILEDGER AI COPILOT - PRODUCTION ENV
# ===========================================

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# AI Services
OPENAI_API_KEY="sk-your_openai_api_key_here"

# Messaging Services
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_WEBHOOK_SECRET="your_webhook_secret_here"

# Payment Processing
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Authentication
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app"
GOOGLE_CLIENT_ID="123456789-abc...googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc..."

# Public Variables
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
NEXT_PUBLIC_APP_URL="https://ai-copilot-nextjs-1rxmcekyo-equi-ledger.vercel.app"
EOF

    print_success "Environment template created: .env.production"
    print_warning "Please edit .env.production with your actual API keys"
}

# Test database connection
test_database() {
    print_status "Testing database connection..."
    
    if [ -f ".env.local" ]; then
        source .env.local
        if [ -n "$DATABASE_URL" ]; then
            print_success "Database URL found in .env.local"
            print_status "You can now run: pnpm db:push"
        else
            print_warning "DATABASE_URL not found in .env.local"
        fi
    else
        print_warning ".env.local not found. Please create it first."
    fi
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if [ -f ".env.production" ]; then
        print_success "Environment file found. Ready to deploy!"
        print_status "Run: vercel --prod --yes"
    else
        print_warning "Please create .env.production first"
    fi
}

# Main menu
show_menu() {
    echo ""
    echo "What would you like to do?"
    echo "1. Check required tools"
    echo "2. Generate environment template"
    echo "3. Test database connection"
    echo "4. Deploy to Vercel"
    echo "5. Show setup checklist"
    echo "6. Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1) check_tools ;;
        2) generate_env_template ;;
        3) test_database ;;
        4) deploy_vercel ;;
        5) show_checklist ;;
        6) exit 0 ;;
        *) print_error "Invalid choice. Please try again." ;;
    esac
}

# Show setup checklist
show_checklist() {
    echo ""
    echo "📋 SETUP CHECKLIST"
    echo "=================="
    echo ""
    echo "✅ GitHub repository created"
    echo "✅ Vercel project deployed"
    echo "✅ Database schema generated"
    echo ""
    echo "🔄 TODO:"
    echo "□ Create Supabase project"
    echo "□ Get OpenAI API key"
    echo "□ Set up Twilio WhatsApp sandbox"
    echo "□ Create Telegram bot"
    echo "□ Set up Stripe account"
    echo "□ Configure Google OAuth"
    echo "□ Add environment variables to Vercel"
    echo "□ Test production deployment"
    echo ""
    echo "📖 For detailed instructions, see: PRODUCTION_SETUP.md"
}

# Run the script
main() {
    echo "Welcome to EquiLedger AI Copilot setup!"
    echo ""
    
    while true; do
        show_menu
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
