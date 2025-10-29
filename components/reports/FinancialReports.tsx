'use client';

import { useState, useEffect } from 'react';
import { Button } from 'components/Button/Button';

interface FinancialSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    total: number;
    invoiceCount: number;
  };
  expenses: {
    total: number;
    expenseCount: number;
  };
  profit: {
    net: number;
    margin: number;
  };
}

interface VATReport {
  period: {
    startDate: string;
    endDate: string;
  };
  vatCollected: number;
  vatPaid: number;
  vatOwed: number;
  invoiceCount: number;
  expenseCount: number;
}

export function FinancialReports() {
  const [activeReport, setActiveReport] = useState<'summary' | 'vat' | 'profit-loss'>('summary');
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [vatReport, setVatReport] = useState<VATReport | null>(null);

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user-id',
          period,
          reportType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (reportType === 'financial_summary') {
          setSummary(data.summary);
        } else if (reportType === 'vat_report') {
          setVatReport(data.summary);
        }
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeReport === 'summary') {
      generateReport('financial_summary');
    } else if (activeReport === 'vat') {
      generateReport('vat_report');
    }
  }, [period, activeReport]);

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;
  const formatPercentage = (percentage: number) => `${percentage.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Financial Reports
        </h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
        {[
          { id: 'summary', label: 'Financial Summary', icon: '📊' },
          { id: 'vat', label: 'VAT Report', icon: '🧾' },
          { id: 'profit-loss', label: 'Profit & Loss', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReport(tab.id as any)}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeReport === tab.id
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Generating report...</p>
        </div>
      ) : (
        <>
          {activeReport === 'summary' && summary && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <span className="text-green-600 dark:text-green-400 text-xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(summary.revenue.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {summary.revenue.invoiceCount} invoices
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <span className="text-red-600 dark:text-red-400 text-xl">💸</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(summary.expenses.total)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {summary.expenses.expenseCount} expenses
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <span className="text-blue-600 dark:text-blue-400 text-xl">📈</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(summary.profit.net)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatPercentage(summary.profit.margin)} margin
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-full">
                    <span className="text-purple-600 dark:text-purple-400 text-xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Period</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(summary.period.startDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">to</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {new Date(summary.period.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'vat' && vatReport && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <span className="text-green-600 dark:text-green-400 text-xl">📥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VAT Collected</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(vatReport.vatCollected)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From {vatReport.invoiceCount} invoices
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <span className="text-red-600 dark:text-red-400 text-xl">📤</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VAT Paid</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(vatReport.vatPaid)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From {vatReport.expenseCount} expenses
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${vatReport.vatOwed >= 0 ? 'bg-blue-100 dark:bg-blue-900' : 'bg-orange-100 dark:bg-orange-900'}`}>
                    <span className={`text-xl ${vatReport.vatOwed >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {vatReport.vatOwed >= 0 ? '💰' : '⚠️'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {vatReport.vatOwed >= 0 ? 'VAT Owed to SARS' : 'VAT Refund Due'}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(Math.abs(vatReport.vatOwed))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {vatReport.vatOwed >= 0 ? 'Payable' : 'Refundable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeReport === 'profit-loss' && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">📈</div>
              <p className="text-gray-500 dark:text-gray-400">
                Detailed Profit & Loss report coming soon!
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
