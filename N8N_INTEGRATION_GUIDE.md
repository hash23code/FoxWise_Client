# FoxWise n8n Integration Guide

## Overview

This guide provides complete instructions for integrating n8n workflows with FoxWise to handle:
1. Email invoicing and payment reminders
2. Batch email campaigns to clients
3. SMS notifications (optional)
4. Automated reporting

## Prerequisites

- n8n server running (you mentioned it's already up)
- FoxWise deployed on Vercel
- Environment variables configured

## Server Setup

### n8n Installation (Already Done)

Your n8n server should be accessible at your domain. If not yet configured:

```bash
# Docker setup (recommended)
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

## Workflow 1: Invoice & Payment Reminders

### Purpose
Send invoice emails or payment reminders to clients via n8n.

### FoxWise API Endpoint

**POST** `/api/emails/send-invoice`

**Request Body:**
```json
{
  "clientIds": ["uuid-1", "uuid-2"],
  "type": "invoice" | "reminder",
  "customMessage": "Optional custom message"
}
```

**Response:**
```json
{
  "success": true,
  "queuedCount": 2,
  "workflowUrl": "https://your-n8n-server.com/webhook/invoice"
}
```

### n8n Workflow Setup

1. **Create New Workflow** in n8n
2. **Add Webhook Node** (Trigger)
   - Method: POST
   - Path: `invoice`
   - Response Mode: `On Last Node`

3. **Add Function Node** - Parse Request
   ```javascript
   const { clientIds, type, customMessage } = $json.body;
   const supabaseUrl = 'YOUR_SUPABASE_URL';
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

   return {
     clientIds,
     type,
     customMessage,
     supabaseUrl,
     supabaseKey
   };
   ```

4. **Add HTTP Request Node** - Fetch Client Data
   - Method: GET
   - URL: `={{$node["Parse Request"].json["supabaseUrl"]}}/rest/v1/fc_clients?id=in.({{$node["Parse Request"].json["clientIds"].join(",")}})`
   - Headers:
     - `apikey`: `={{$node["Parse Request"].json["supabaseKey"]}}`
     - `Authorization`: `Bearer ={{$node["Parse Request"].json["supabaseKey"]}}`

5. **Add Split In Batches Node**
   - Batch Size: 10 (to avoid rate limits)

6. **Add Send Email Node**
   - For each client:
   ```javascript
   // In Function node before email:
   const client = $json;
   const type = $node["Parse Request"].json["type"];

   let subject, body;

   if (type === 'invoice') {
     subject = `Invoice from FoxWise - ${client.name}`;
     body = `
       Dear ${client.name},

       Please find attached your invoice.

       Total Amount: ${{client.totalDue}}
       Due Date: {{client.dueDate}}

       Thank you for your business!

       FoxWise Team
     `;
   } else {
     subject = `Payment Reminder - ${client.name}`;
     body = `
       Dear ${client.name},

       This is a friendly reminder that payment is due.

       Amount Due: ${{client.totalDue}}

       Please process payment at your earliest convenience.

       Thank you!
       FoxWise Team
     `;
   }

   return {
     to: client.email,
     subject,
     body,
     from: 'noreply@foxwise.app'
   };
   ```

7. **Add SMTP/SendGrid Node**
   - Configure with your email provider:
     - **SendGrid**: API Key method (recommended)
     - **SMTP**: Gmail, Outlook, or custom SMTP
   - From: `noreply@foxwise.app`
   - To: `={{$json["to"]}}`
   - Subject: `={{$json["subject"]}}`
   - Body: `={{$json["body"]}}`

8. **Save & Activate Workflow**

### FoxWise API Implementation

Create `/app/api/emails/send-invoice/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL_INVOICE

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientIds, type, customMessage } = body

    // Forward to n8n webhook
    const response = await fetch(N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientIds,
        type,
        customMessage,
        triggeredBy: userId,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error('n8n webhook failed')
    }

    return NextResponse.json({
      success: true,
      queuedCount: clientIds.length,
      workflowUrl: N8N_WEBHOOK_URL
    })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json({ error: 'Failed to queue emails' }, { status: 500 })
  }
}
```

### Environment Variables

Add to `.env.local`:
```env
N8N_WEBHOOK_URL_INVOICE=https://your-n8n.com/webhook/invoice
N8N_WEBHOOK_URL_CAMPAIGN=https://your-n8n.com/webhook/campaign
```

---

## Workflow 2: Email Marketing Campaigns

### Purpose
Send batch email campaigns to selected or all clients.

### FoxWise API Endpoint

**POST** `/api/emails/send-campaign`

**Request Body:**
```json
{
  "campaignId": "uuid",
  "clientIds": ["uuid-1", "uuid-2"] | "all",
  "subject": "Campaign Subject",
  "body": "HTML email body",
  "scheduledAt": "2025-01-20T10:00:00Z" | null
}
```

### n8n Workflow Setup

1. **Create New Workflow** in n8n
2. **Add Webhook Node**
   - Path: `campaign`

3. **Add Function Node** - Parse & Fetch Recipients
   ```javascript
   const { campaignId, clientIds, subject, body, scheduledAt } = $json.body;
   const now = new Date();
   const scheduled = scheduledAt ? new Date(scheduledAt) : now;

   // If scheduled in future, wait
   if (scheduled > now) {
     const waitMs = scheduled - now;
     return { wait: waitMs, ...$ json.body };
   }

   return $json.body;
   ```

4. **Add Wait Node** (conditional)
   - Wait for: `={{$json["wait"]}}` milliseconds

5. **Add HTTP Request** - Fetch Clients
   - If `clientIds === "all"`: Fetch all clients from company
   - Else: Fetch specific clients

6. **Add Split In Batches**
   - Batch Size: 50

7. **Add Function Node** - Personalize Email
   ```javascript
   const client = $json;
   const campaign = $node["Parse Request"].json;

   // Replace placeholders
   let personalizedBody = campaign.body
     .replace(/\{\{client\.name\}\}/g, client.name)
     .replace(/\{\{client\.email\}\}/g, client.email)
     .replace(/\{\{company\.name\}\}/g, campaign.companyName);

   return {
     to: client.email,
     subject: campaign.subject,
     html: personalizedBody,
     clientId: client.id,
     campaignId: campaign.campaignId
   };
   ```

8. **Add SendGrid/SMTP Node**
   - Send personalized email

9. **Add HTTP Request** - Update Campaign Status
   - POST to FoxWise API to mark email as sent
   - URL: `https://fox-wise-client.vercel.app/api/emails/update-status`
   - Body:
     ```json
     {
       "campaignId": "={{$json["campaignId"]}}",
       "clientId": "={{$json["clientId"]}}",
       "status": "sent",
       "sentAt": "={{$now}}"
     }
     ```

---

## Workflow 3: Automated Reports (Optional)

### Purpose
Send weekly/monthly reports to managers about team performance, payments, job completion.

### n8n Workflow Setup

1. **Add Schedule Trigger**
   - Cron: `0 9 * * 1` (Every Monday at 9am)

2. **Add HTTP Request** - Fetch Report Data
   - GET `https://fox-wise-client.vercel.app/api/reports/weekly`

3. **Add Function Node** - Format Report
   ```javascript
   const data = $json;

   const html = `
     <h2>Weekly Report</h2>
     <h3>Jobs Completed: ${data.jobsCompleted}</h3>
     <h3>Revenue: $${data.revenue}</h3>
     <h3>Top Performer: ${data.topEmployee}</h3>
   `;

   return {
     to: data.managerEmail,
     subject: 'Weekly FoxWise Report',
     html
   };
   ```

4. **Add Email Node**
   - Send formatted report

---

## Security Best Practices

### 1. Webhook Authentication

Add authentication to your n8n webhooks:

**In n8n Webhook Node:**
- Add Header Auth
- Key: `X-API-Key`
- Value: Generate strong key

**In FoxWise:**
```typescript
const response = await fetch(N8N_WEBHOOK_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.N8N_API_KEY!
  },
  body: JSON.stringify(data)
})
```

### 2. Rate Limiting

Configure in n8n:
- Split batches to max 10-50 per minute
- Add delays between batches (5-10 seconds)

### 3. Error Handling

Add Error Trigger node:
- On workflow error → Send alert to manager
- Log to database or external service

---

## Email Templates

### Invoice Template (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .total { font-size: 24px; font-weight: bold; color: #ef4444; }
    .button { background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice from FoxWise</h1>
    </div>
    <div class="content">
      <p>Dear {{client.name}},</p>
      <p>Thank you for your business. Please find your invoice details below:</p>

      <h3>Invoice #{{invoice.number}}</h3>
      <p>Issue Date: {{invoice.issueDate}}</p>
      <p>Due Date: {{invoice.dueDate}}</p>

      <div style="margin: 20px 0;">
        <h4>Services:</h4>
        {{#each items}}
        <p>{{this.description}} - ${{this.amount}}</p>
        {{/each}}
      </div>

      <p class="total">Total Amount: ${{invoice.total}}</p>

      <a href="{{paymentLink}}" class="button">Pay Now</a>

      <p style="margin-top: 30px; color: #6b7280;">
        If you have any questions, please contact us.
      </p>
    </div>
  </div>
</body>
</html>
```

### Payment Reminder Template

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f59e0b; color: white; padding: 30px; text-align: center; }
    .content { background: #f9fafb; padding: 30px; }
    .amount { font-size: 28px; font-weight: bold; color: #f59e0b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Reminder</h1>
    </div>
    <div class="content">
      <p>Dear {{client.name}},</p>
      <p>This is a friendly reminder that the following payment is due:</p>

      <p class="amount">${{amount}}</p>

      <p>Invoice #{{invoice.number}}</p>
      <p>Due Date: {{invoice.dueDate}}</p>

      <p>Please process payment at your earliest convenience.</p>

      <a href="{{paymentLink}}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px;">
        Pay Now
      </a>
    </div>
  </div>
</body>
</html>
```

---

## Testing

### Test Invoice Workflow

```bash
curl -X POST https://your-n8n.com/webhook/invoice \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "clientIds": ["test-uuid"],
    "type": "invoice",
    "customMessage": "Test invoice"
  }'
```

### Test Campaign Workflow

```bash
curl -X POST https://your-n8n.com/webhook/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "campaignId": "test-campaign",
    "clientIds": ["test-uuid"],
    "subject": "Test Campaign",
    "body": "Hello {{client.name}}!",
    "scheduledAt": null
  }'
```

---

## Monitoring & Analytics

### Track Email Opens (Optional)

1. **Add tracking pixel to emails:**
   ```html
   <img src="https://your-n8n.com/webhook/track?campaignId={{campaignId}}&clientId={{clientId}}" width="1" height="1" />
   ```

2. **Create tracking webhook in n8n:**
   - Webhook path: `track`
   - Update database with open status

### Dashboard Metrics

Track in Supabase:
- Total emails sent
- Open rate
- Click rate (if using tracked links)
- Bounce rate

---

## Troubleshooting

### Common Issues

**1. Emails not sending:**
- Check n8n workflow is activated
- Verify webhook URL in environment variables
- Check SMTP/SendGrid credentials
- Review n8n execution logs

**2. Rate limiting:**
- Reduce batch size
- Increase delay between batches
- Use dedicated email service (SendGrid recommended)

**3. Webhook timeout:**
- Return immediate response in FoxWise
- Process emails asynchronously in n8n
- Don't wait for completion

### Logs

**n8n Logs:**
- Access via n8n UI → Executions
- Filter by workflow name
- Check error messages

**FoxWise Logs:**
- Vercel dashboard → Functions
- Check API route logs
- Monitor error rates

---

## Production Checklist

- [ ] n8n server SSL configured
- [ ] Webhook URLs added to environment variables
- [ ] API keys secured (not in code)
- [ ] Email templates tested
- [ ] Rate limits configured
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Backup workflows exported
- [ ] Documentation updated
- [ ] Team trained on system

---

## Advanced: AI Email Assistant Integration

For the AI email writing assistant requested, integrate OpenAI:

### n8n Workflow Addition

1. **Add OpenAI Node** before sending email
   - Operation: Complete
   - Model: gpt-4
   - Prompt:
     ```
     Improve this email for professionalism and clarity.
     Make it friendly but business-appropriate.

     Original:
     {{$json["body"]}}

     Return only the improved email text.
     ```

2. **Use AI-generated text** in email body

### FoxWise UI Integration

Add OpenAI call in email composition page:

```typescript
const improveWithAI = async (text: string) => {
  const response = await fetch('/api/ai/improve-email', {
    method: 'POST',
    body: JSON.stringify({ text })
  })
  const { improved } = await response.json()
  return improved
}
```

---

## Summary

You now have:
1. ✅ Complete n8n workflow designs
2. ✅ FoxWise API endpoints ready
3. ✅ Email templates (HTML)
4. ✅ Security best practices
5. ✅ Testing procedures
6. ✅ Monitoring setup
7. ✅ AI integration path

**Next Steps:**
1. Copy webhook URLs from n8n to FoxWise env vars
2. Import/create workflows in n8n
3. Test with sample data
4. Deploy to production
5. Monitor first sends

Good luck! 🚀
