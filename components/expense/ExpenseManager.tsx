'use client';

import { useState } from 'react';
import { Button } from 'components/Button/Button';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  vatAmount: number;
  createdAt: string;
}

interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
}

const EXPENSE_CATEGORIES = [
  'Transport',
  'Office Supplies',
  'Marketing',
  'Professional Services',
  'Utilities',
  'Equipment',
  'Travel',
  'Meals',
  'Other',
];

export function ExpenseManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleCreateExpense = async () => {
    if (!formData.description || !formData.amount || !formData.category) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userId: 'test-user-id', // In real app, this would come from auth
        }),
      });

      if (response.ok) {
        const newExpense = await response.json();
        setExpenses(prev => [newExpense, ...prev]);
        setFormData({ 
          description: '', 
          amount: 0, 
          category: '', 
          date: new Date().toISOString().split('T')[0] 
        });
        setShowForm(false);
      } else {
        throw new Error('Failed to create expense');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      alert('Failed to create expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Transport': 'bg-blue-100 text-blue-800',
      'Office Supplies': 'bg-green-100 text-green-800',
      'Marketing': 'bg-purple-100 text-purple-800',
      'Professional Services': 'bg-orange-100 text-orange-800',
      'Utilities': 'bg-yellow-100 text-yellow-800',
      'Equipment': 'bg-red-100 text-red-800',
      'Travel': 'bg-indigo-100 text-indigo-800',
      'Meals': 'bg-pink-100 text-pink-800',
      'Other': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalVAT = expenses.reduce((sum, expense) => sum + expense.vatAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Expense Tracking
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Total: R{totalExpenses.toFixed(2)} | VAT: R{totalVAT.toFixed(2)}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Expense'}
        </Button>
      </div>

      {/* Create Expense Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Log New Expense
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What was this expense for?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (ZAR) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receipt (optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  // Handle file upload in real implementation
                  console.log('Receipt file:', e.target.files?.[0]);
                }}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button onClick={handleCreateExpense} disabled={loading}>
              {loading ? 'Logging...' : 'Log Expense'}
            </Button>
            <Button onClick={() => setShowForm(false)} intent="secondary">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Expenses
          </h3>
          
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-lg mb-2">💰</div>
              <p className="text-gray-500 dark:text-gray-400">
                No expenses logged yet. Track your first business expense to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Category
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      VAT
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b">
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {expense.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        R{expense.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        R{expense.vatAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
