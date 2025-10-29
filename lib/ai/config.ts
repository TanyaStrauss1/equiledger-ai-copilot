import { openai } from '@ai-sdk/openai';
import { env } from '@/env.mjs';

// OpenAI client configuration
export const openaiClient = openai({
  apiKey: env.OPENAI_API_KEY,
});

// AI model configurations
export const AI_MODELS = {
  // For general chat and intent detection
  CHAT: 'gpt-4o-mini',
  // For complex reasoning and analysis
  REASONING: 'gpt-4o',
  // For embeddings and similarity search
  EMBEDDINGS: 'text-embedding-3-small',
} as const;

// AI system prompts
export const SYSTEM_PROMPTS = {
  FINANCIAL_ASSISTANT: `You are EquiLedger, an AI financial assistant for South African SMEs. 

Your capabilities:
- Create and manage invoices with VAT calculations
- Track business expenses and categorize them
- Generate financial reports and summaries
- Provide VAT compliance guidance
- Help with basic accounting tasks

Key principles:
- Always calculate VAT correctly (15% standard rate in South Africa)
- Be precise with financial calculations
- Provide clear, actionable responses
- Ask for clarification when needed
- Maintain professional tone

When creating invoices:
- Include proper VAT calculations
- Set appropriate due dates (default 30 days)
- Generate professional descriptions
- Ensure compliance with South African tax requirements

When tracking expenses:
- Categorize appropriately (transport, office, marketing, etc.)
- Calculate VAT amounts correctly
- Include receipt references when available

Always respond in a helpful, professional manner and provide accurate financial information.`,

  INTENT_DETECTION: `You are an intent detection system for a financial assistant chatbot.

Analyze user messages and determine the intent and extract relevant parameters.

Available intents:
- INVOICE_CREATE: Create new invoice
- INVOICE_LIST: List invoices (paid/unpaid/all)
- INVOICE_UPDATE: Mark invoice as paid or update status
- EXPENSE_LOG: Record business expense
- FINANCIAL_SUMMARY: Generate financial reports/summaries
- COMPLIANCE_CHECK: Check VAT/tax compliance
- REMINDER_SET: Set payment reminders
- REPORT_GENERATE: Generate specific reports
- HELP: Show available commands
- GREETING: General greeting or small talk

Return JSON with:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "parameters": {
    "amount": 500,
    "client": "ABC Company",
    "description": "Website design",
    "date": "2024-01-15",
    "category": "services"
  },
  "response": "Human-readable response",
  "actions": ["action1", "action2"]
}`,
} as const;

// AI tool schemas using Zod
export const AI_TOOLS = {
  CREATE_INVOICE: {
    name: 'create_invoice',
    description: 'Create a new invoice for a client',
    parameters: {
      type: 'object',
      properties: {
        clientName: {
          type: 'string',
          description: 'Name of the client',
        },
        amount: {
          type: 'number',
          description: 'Invoice amount in ZAR',
        },
        description: {
          type: 'string',
          description: 'Description of services/products',
        },
        dueInDays: {
          type: 'number',
          description: 'Days until payment is due (default 30)',
          default: 30,
        },
        vatIncluded: {
          type: 'boolean',
          description: 'Whether VAT is included in the amount',
          default: true,
        },
      },
      required: ['clientName', 'amount', 'description'],
    },
  },
  
  LOG_EXPENSE: {
    name: 'log_expense',
    description: 'Record a business expense',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Expense amount in ZAR',
        },
        description: {
          type: 'string',
          description: 'Description of the expense',
        },
        category: {
          type: 'string',
          description: 'Expense category (transport, office, marketing, etc.)',
        },
        date: {
          type: 'string',
          description: 'Date of the expense (ISO format)',
        },
        receipt: {
          type: 'string',
          description: 'Receipt reference or URL',
        },
      },
      required: ['amount', 'description', 'category'],
    },
  },
  
  GET_FINANCIAL_SUMMARY: {
    name: 'get_financial_summary',
    description: 'Get financial summary for a period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          description: 'Time period (month, quarter, year)',
          enum: ['month', 'quarter', 'year'],
        },
        startDate: {
          type: 'string',
          description: 'Start date (ISO format)',
        },
        endDate: {
          type: 'string',
          description: 'End date (ISO format)',
        },
      },
      required: ['period'],
    },
  },
} as const;
