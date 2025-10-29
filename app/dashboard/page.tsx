'use client';

import { useState } from 'react';
import { Button } from 'components/Button/Button';
import { InvoiceManager } from 'components/invoice/InvoiceManager';
import { ExpenseManager } from 'components/expense/ExpenseManager';
import { FinancialReports } from 'components/reports/FinancialReports';

export default function Dashboard() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'invoices' | 'expenses' | 'reports'>('chat');

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId: 'test-user-id', // In real app, this would come from auth
        }),
      });

      const data = await res.json();
      setResponse(data.message || 'No response received');
    } catch (error) {
      setResponse('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            EquiLedger Dashboard
          </h1>
          
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              {[
                { id: 'chat', label: 'AI Chat', icon: '🤖' },
                { id: 'invoices', label: 'Invoices', icon: '📄' },
                { id: 'expenses', label: 'Expenses', icon: '💰' },
                { id: 'reports', label: 'Reports', icon: '📊' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'chat' && (
              <>
                {/* Quick Actions */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => setMessage('Create invoice for R500 website design for ABC Company')}
                    className="w-full"
                  >
                    📄 Create Invoice
                  </Button>
                  <Button 
                    onClick={() => setMessage('Record R450 for transport fuel')}
                    className="w-full"
                    intent="secondary"
                  >
                    💰 Log Expense
                  </Button>
                  <Button 
                    onClick={() => setMessage('How much did I make this month?')}
                    className="w-full"
                    intent="secondary"
                  >
                    📊 Monthly Summary
                  </Button>
                </div>

                {/* Chat Interface */}
                <div className="border rounded-lg p-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    AI Assistant
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Ask me anything about your finances..."
                        className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleSendMessage}
                      disabled={loading || !message.trim()}
                      className="w-full"
                    >
                      {loading ? 'Processing...' : 'Send Message'}
                    </Button>
                    
                    {response && (
                      <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          AI Response:
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {response}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'invoices' && <InvoiceManager />}
            
            {activeTab === 'expenses' && <ExpenseManager />}
            
            {activeTab === 'reports' && <FinancialReports />}

            {/* Status */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Development Status
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>✅ Next.js 15 with App Router</li>
                <li>✅ Vercel AI SDK integration</li>
                <li>✅ Drizzle ORM with PostgreSQL</li>
                <li>✅ WhatsApp & Telegram webhooks</li>
                <li>✅ AI intent detection</li>
                <li>🔄 Database setup (needs environment variables)</li>
                <li>🔄 Webhook testing (needs API keys)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
