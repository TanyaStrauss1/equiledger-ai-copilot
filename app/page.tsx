import { Metadata } from "next"
import { Button } from "components/Button/Button"

export const metadata: Metadata = {
  title: "EquiLedger - AI Financial Assistant for SMEs",
  description: "AI-powered financial management for South African small businesses. Create invoices, track expenses, and manage your finances with natural language.",
  twitter: {
    card: "summary_large_image",
  },
  openGraph: {
    url: "https://equiledger.vercel.app/",
    images: [
      {
        width: 1200,
        height: 630,
        url: "https://equiledger.vercel.app/og-image.png",
      },
    ],
  },
}

export default function Web() {
  return (
    <>
      <section className="bg-white dark:bg-gray-900">
        <div className="mx-auto grid max-w-(--breakpoint-xl) px-4 py-8 text-center lg:py-16">
          <div className="mx-auto place-self-center">
            <h1 className="mb-4 max-w-2xl text-4xl leading-none font-extrabold tracking-tight md:text-5xl xl:text-6xl dark:text-white">
              EquiLedger
            </h1>
            <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
              AI-powered financial management for South African SMEs. Create invoices, track expenses, 
              and manage your finances with natural language through WhatsApp, Telegram, or web chat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/dashboard" className="mr-3">
                Get Started
              </Button>
              <Button
                href="https://wa.me/27612345678"
                intent="secondary"
              >
                Try WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-8 sm:py-16 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Everything you need to manage your business finances
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-blue-100 dark:bg-blue-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-blue-700">
                📄
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Smart Invoicing</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create professional invoices with automatic VAT calculations. 
                Send via WhatsApp or generate PDFs.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-green-100 dark:bg-green-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-green-700">
                💰
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Expense Tracking</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Log business expenses with receipt photos. 
                Automatic categorization and VAT calculations.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-purple-100 dark:bg-purple-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-purple-700">
                📊
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Financial Reports</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get instant financial summaries, profit reports, 
                and VAT compliance insights.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-orange-100 dark:bg-orange-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-orange-700">
                🤖
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">AI Assistant</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Natural language processing for all financial tasks. 
                Just tell us what you need in plain English.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-teal-100 dark:bg-teal-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-teal-700">
                📱
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">Multi-Channel</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Access via WhatsApp, Telegram, or web interface. 
                Your data syncs across all platforms.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-sm">
              <div className="bg-red-100 dark:bg-red-900 mb-4 flex size-12 items-center justify-center rounded-full p-1.5 text-red-700">
                🇿🇦
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">SA Compliant</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Built for South African businesses with proper VAT rates, 
                tax compliance, and local regulations.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-8 sm:py-16 lg:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Try EquiLedger today and see how AI can transform your business finances
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/dashboard" size="lg">
                Start Free Trial
              </Button>
              <Button href="https://wa.me/27612345678" intent="secondary" size="lg">
                Chat on WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
