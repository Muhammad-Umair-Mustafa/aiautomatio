# AI Outreach Dashboard – MVP

## 1. Overview

AI Outreach Dashboard is a SaaS-style web application connected to n8n workflows.

The purpose of the MVP is simple:

- Track total emails sent
- Display outreach leads
- Show detailed contact information
- Sync data automatically from n8n
- Provide a clean, modern SaaS UI

This version focuses only on visibility and tracking.
No analytics. No AI scoring. Just clean execution.

---

## 2. Core Features (MVP Scope)

### 2.1 Dashboard Overview Page

Display:

- Total Emails Sent (All Time)
- Emails Sent Today
- Emails Sent This Week
- Total Leads
- Last Email Sent Timestamp

Optional:
- Simple line chart of emails sent per day

---

### 2.2 Outreach Leads Page

Table listing all contacts fetched from n8n.

Columns:

- Full Name
- Company Name
- Email Address
- Phone Number
- Website
- Status (Sent / Pending)
- Date Email Sent

Features:

- Search by name/company/email
- Pagination
- Click row to view full lead details

---

### 2.3 Lead Detail Page

When clicking a lead, show:

- Full Name
- Company
- Email
- Phone
- Website
- Custom Fields (if any)
- Email Sent Timestamp
- Campaign Name
- Raw Email Content Sent

Layout should look clean and premium.
Card-based UI.

---

## 3. Data Structure (Database Schema)

Table: leads

- id (UUID)
- full_name (string)
- company_name (string)
- email (string)
- phone (string)
- website (string)
- email_content (text)
- campaign_name (string)
- status (string)
- sent_at (timestamp)
- created_at (timestamp)

---

Table: email_stats

- id (UUID)
- total_sent (integer)
- sent_today (integer)
- sent_this_week (integer)
- last_sent_at (timestamp)
- updated_at (timestamp)

---

## 4. n8n Integration

Flow:

1. n8n sends email
2. After sending, n8n triggers webhook
3. Webhook sends:

{
  full_name,
  company_name,
  email,
  phone,
  website,
  email_content,
  campaign_name,
  sent_at
}

4. Backend stores data in database
5. Dashboard updates automatically

Webhook endpoint:

POST /api/leads

---

## 5. Tech Stack (Recommended)

Frontend:
- Next.js
- Tailwind CSS
- Shadcn UI
- Recharts (optional for charts)

Backend:
- Next.js API routes
OR
- Node.js + Express

Database:
- PostgreSQL
OR
- Supabase

Auth:
- Simple email/password login

---

## 6. UI / Design Requirements

Design Style:

- Modern SaaS
- Clean white or dark theme
- Soft shadows
- Rounded cards
- Minimal gradients
- Smooth hover effects
- Clean typography
- Professional spacing

Layout:

Sidebar:
- Dashboard
- Outreach
- Settings

Top bar:
- App name
- User avatar
- Logout

Cards should look like:
Stripe / Linear / Notion style design

---

## 7. What Is NOT Included in MVP

- Open rate
- Bounce rate
- Spam tracking
- AI scoring
- Multi-client mode
- A/B testing
- Automation builder

Those will be V2 features.

---

## 8. MVP Goal

The goal is to:

Turn n8n outreach automation into a visual SaaS dashboard
that looks premium and client-ready.

It should feel like a product.
Not a tool.