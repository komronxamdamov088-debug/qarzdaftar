

# CLAUDE.md — QarzDaftar

## 1. PROJECT OVERVIEW

Project name: **QarzDaftar**

Tagline:
**"Qarz unutilmaydi. Munosabat buzilmaydi."**

QarzDaftar — O'zbekiston bozori uchun zamonaviy shaxsiy qarzlarni boshqarish platformasi.

Platforma foydalanuvchiga:
- qarz berilganini yozish
- qarz olinganini yozish
- qolgan summani kuzatish
- qaytarish sanasini belgilash
- bo'lib-bo'lib to'lashni boshqarish
- qarzni ikkinchi tomon bilan tasdiqlash
- eslatmalar olish
- AI yordamida muloyim reminder yaratish
- shaxsiy qarz statistikalarini ko'rish

Default language: **Uzbek Latin**
Currency: **UZS / so'm**

Example:
`350 000 so'm`

---

# 2. PRODUCT STRUCTURE

MVP'da quyidagi qismlar mavjud:

1. Public Landing Page
2. User Application
3. Admin Panel
4. NestJS Backend / REST API
5. Supabase PostgreSQL
6. PWA
7. Telegram Mini App
8. Web Push notifications
9. Telegram Bot notifications

### IMPORTANT

**Separate Client Panel mavjud emas.**

MVP rollari:

- `USER`
- `ADMIN`

Telegram Mini App — alohida product emas; u mavjud Next.js frontendning Telegram ichidagi ishga tushiriladigan versiyasi.

PWA va Telegram Mini App bir xil asosiy frontend/business flow'dan foydalanishi kerak.

---

# 3. FIXED TECHNOLOGY STACK

## Frontend

- Next.js
- TypeScript
- Tailwind CSS
- App Router
- PWA
- Telegram Mini App

Prefer Server Components by default.

Client Components faqat browser APIs, interactive state yoki Telegram WebApp APIs kerak bo'lganda ishlatiladi.

## Backend

- NestJS
- TypeScript
- REST API

## Database

- Supabase PostgreSQL

Supabase boshqa database bilan almashtirilmaydi.

## Hosting

Backend:
- Render free tier

Database:
- Supabase free tier

Frontend:
- Next.js bilan mos free hosting platform

Production URL'larni hardcode qilma.

Environment variables ishlat.

---

# 4. HIGH-LEVEL ARCHITECTURE

```text
                    QARZDAFTAR
                         |
          +--------------+--------------+
          |                             |
       Web / PWA                  Telegram Mini App
       Next.js                       Next.js
          |                             |
          +--------------+--------------+
                         |
                     REST API
                         |
                  NestJS Backend
                         |
              +----------+----------+
              |                     |
        Supabase PostgreSQL     Services
              |                     |
       +------+-----+          +----+------+
       |            |          |           |
     Users        Debts      Web Push   Telegram Bot
     Payments     Reminders
```

### Core principle

**Frontend is not the source of truth.**

Backend + database are the source of truth.

---

# 5. TARGET USERS

Primary users:

- students
- young adults
- friends
- families
- classmates
- colleagues
- roommates
- freelancers
- people who regularly lend or borrow small amounts

Typical scenario:

Komron Azizga 350 000 so'm beradi.

QarzDaftar:

- qarzni yaratadi
- Azizga tasdiqlash linkini beradi
- qaytarish sanasini saqlaydi
- qisman to'lovlarni hisoblaydi
- muddat yaqinlashganda reminder beradi
- AI orqali muloyim reminder matni yaratadi

---

# 6. CORE PROBLEM

Odamlar orasidagi qarzlarda:

- summa unutiladi
- qaytarish sanasi esdan chiqadi
- qisman to'lovlar chalkashadi
- kim qancha bergani/olganini eslab qolish qiyin
- qarzni so'rash noqulay bo'ladi

QarzDaftar:

**financial clarity without damaging relationships.**

---

# 7. USER ROLE

## USER

Normal foydalanuvchi:

Can:
- register/login
- create debts
- edit own debts
- view own debts
- confirm debts
- record payments
- create reminders
- generate AI reminders
- manage notification preferences
- view statistics
- manage profile
- connect Telegram
- install/use PWA

User faqat o'ziga tegishli yoki o'zi bilan explicitly shared qilingan ma'lumotlarni ko'ra oladi.

---

# 8. ADMIN ROLE

Admin platformani boshqaradi.

Admin can:
- view platform analytics
- manage users
- review reports
- manage notifications/system settings
- monitor platform health

Admin private debt details'ni default holatda ko'rmasligi kerak.

Privacy first.

Admin authorization faqat frontenddagi role check bilan himoyalanmasin.

Backend server-side authorization majburiy.

---

# 9. LANDING PAGE

Hero:

**"Qarz unutilmaydi.
Munosabat buzilmaydi."**

Subtitle:

**"Kim sizdan qancha olganini yoki siz kimdan qancha qarzdor ekaningizni oddiy va qulay boshqaring."**

Primary CTA:
`Boshlash`

Secondary CTA:
`Qanday ishlaydi?`

Sections:

1. Hero
2. Problem
3. How it works
4. Features
5. AI Reminder
6. Installments
7. Mutual Confirmation
8. Statistics
9. Privacy
10. FAQ
11. Final CTA
12. Footer

Landing page premium, minimal va trustworthy bo'lishi kerak.

Generic AI template ko'rinishidan qoch.

---

# 10. USER APP

## Dashboard

Dashboard darhol ko'rsatadi:

### Menga berishlari kerak
Example:
`1 250 000 so'm`

### Men berishim kerak
Example:
`680 000 so'm`

### Balans
Example:
`+570 000 so'm`

Additional:

- upcoming repayments
- overdue debts
- recent activity
- quick add debt

Primary CTA:
`+ Qarz qo'shish`

---

# 11. ADD DEBT FLOW

Flow:

Dashboard
→ Qarz qo'shish
→ Person
→ Amount
→ Type
→ Due date
→ Payment structure
→ Note
→ Review
→ Create
→ Confirmation link

Fields:

### Person
- name
- phone (optional)

### Amount
- UZS

### Type
- `Men berdim`
- `Men oldim`

### Date
- created date

### Due date
- repayment deadline

### Payment structure
- one-time
- installments

### Note
optional

Example:

Person:
Aziz Karimov

Amount:
350 000 so'm

Type:
Men berdim

Due date:
30.08.2026

Note:
Telefon uchun

---

# 12. DEBT CONFIRMATION

Debt yaratilgandan keyin secure shareable confirmation link yaratiladi.

Other person ko'radi:

**"Komron sizga 350 000 so'm qarz yozdi."**

Actions:

`Tasdiqlash`
`Bu qarz menga tegishli emas`

Tasdiqlangandan keyin:

`confirmation_status = confirmed`

UI:
**"Ikki tomon tasdiqlagan"**

IMPORTANT:

Bu mutual digital record.

QarzDaftar buni avtomatik legal contract deb da'vo qilmasligi kerak.

---

# 13. DEBT DETAIL

Display:

- person
- original amount
- paid amount
- remaining amount
- created date
- due date
- status
- confirmation status

Example:

```text
AZIZ KARIMOV

350 000 so'm

To'langan:
200 000 so'm

Qolgan:
150 000 so'm

Qaytarish sanasi:
30 avgust

Status:
Qisman to'langan
```

Actions:

`To'lov qo'shish`
`Eslatma`
`Tahrirlash`

---

# 14. PAYMENTS

Partial payments must be supported.

Example:

Original:
`350 000 so'm`

Payments:
- `100 000 so'm`
- `100 000 so'm`

Remaining:
`150 000 so'm`

Formula:

`remainingAmount = originalAmount - SUM(payments)`

Never allow remaining amount below zero.

If remaining amount becomes zero:

`status = paid`

---

# 15. INSTALLMENTS

Support installment schedule.

Example:

350 000 so'm

30 August:
100 000

10 September:
100 000

20 September:
150 000

Show progress clearly.

---

# 16. DEBT STATUS

Supported statuses:

- `pending`
- `confirmed`
- `partially_paid`
- `paid`
- `overdue`
- `cancelled`

Uzbek labels:

- Kutilmoqda
- Tasdiqlangan
- Qisman to'langan
- To'langan
- Muddati o'tgan
- Bekor qilingan

Do not rely on color alone. Use text and icons too.

---

# 17. SEARCH / FILTER / SORT

Search:

- person name
- amount

Filters:

- Men berdim
- Men oldim
- To'lanmagan
- To'langan
- Muddati o'tgan

Sort:

- newest
- oldest
- highest amount
- nearest due date

---

# 18. STATISTICS

Show simple personal statistics:

- Jami bergan
- Jami olgan
- Qaytarilgan
- Qolgan
- Muddati o'tgan

Example:

```text
Jami bergan:
5 250 000 so'm

Jami olgan:
2 100 000 so'm

Qaytarilgan:
3 800 000 so'm

Qolgan:
3 550 000 so'm

Muddati o'tgan:
450 000 so'm
```

Use simple charts.

Do not overwhelm users.

---

# 19. AI REMINDER

AI Reminder is a core differentiating feature.

User selects tone:

- Do'stona
- Hurmatli
- Qisqa
- Rasmiy
- Hazilomuz

AI generates reminder.

Example:

**"Salom, Aziz! 😊 Eslatib qo'yaylik, 350 000 so'mlik qarzingizning qaytarish sanasi yaqinlashmoqda."**

AI MUST NEVER:

- threaten
- shame
- insult
- harass
- intimidate
- manipulate

User must be able to review/edit the message.

Never automatically send an AI-generated message without explicit user confirmation, except for a future clearly opt-in automated reminder feature.

---

# 20. REMINDER SYSTEM

Supported schedule:

- 3 days before
- 1 day before
- due date
- 1 day after
- 3 days after

Reminder states:

- pending
- sent
- failed
- cancelled

Backend must prevent duplicate reminders.

Do not spam.

Users must be able to manage notification preferences.

---

# 21. WEB PUSH / PWA

PWA must support Web Push where browser/platform supports it.

PWA requirements:

- web app manifest
- icons
- installable app
- service worker
- push subscription
- notification permission flow
- notification click handling
- mobile-first UI
- offline app shell where practical

IMPORTANT:

Do not assume Web Push works inside every Telegram environment.

Telegram users should primarily use Telegram notifications.

Do not cache private financial API responses in a public cache.

---

# 22. WEB PUSH FLOW

```text
Browser
→ notification permission
→ service worker
→ PushSubscription
→ POST /push/subscribe
→ NestJS
→ Supabase
```

When reminder is due:

```text
NestJS
→ Web Push provider
→ Browser
→ notification
```

User must be able to disable notifications.

Store push subscription securely.

---

# 23. TELEGRAM MINI APP

Telegram Mini App uses the same Next.js frontend.

Do NOT build a second separate UI codebase.

Mini App must:

- work well inside Telegram mobile viewport
- detect Telegram WebApp environment
- use Telegram WebApp SDK/API
- authenticate through NestJS
- support core QarzDaftar flows
- support Telegram theme parameters where practical
- have proper mobile navigation

Core flows:

- login/auth
- dashboard
- debts
- add debt
- debt detail
- payments
- reminders
- profile

---

# 24. TELEGRAM AUTHENTICATION

Flow:

```text
Telegram Mini App
→ Telegram WebApp initData
→ Next.js
→ NestJS
→ verify initData
→ find/create user
→ create application session
→ return authenticated user
```

IMPORTANT:

Never trust Telegram user data directly on frontend.

Backend must validate Telegram WebApp initData using the official Telegram verification method.

Never expose Telegram Bot Token to frontend.

Never put secrets in `NEXT_PUBLIC_*`.

---

# 25. TELEGRAM ACCOUNT LINKING

One QarzDaftar user may connect:

- phone account
- Telegram account

Example:

```text
QarzDaftar account

Phone:
+998...

Telegram:
@username
```

PWA and Telegram Mini App should access the same account when identities are linked.

Avoid duplicate accounts when linking is valid and verified.

---

# 26. TELEGRAM BOT NOTIFICATIONS

Telegram users can receive reminders through the bot.

Example:

```text
Salom, Aziz! 😊

Eslatib qo'yamiz:
350 000 so'mlik qarzingizning
qaytarish sanasi yaqinlashmoqda.
```

Respect notification preferences.

Do not spam.

---

# 27. NOTIFICATION STRATEGY

If user uses PWA/browser:

Primary:
Web Push

If user has connected Telegram:

Optional:
Telegram notification

Avoid sending duplicate notifications through both channels unless the user explicitly enables both.

---

# 28. DATABASE

Use **Supabase PostgreSQL**.

Suggested tables:

## users

- id
- name
- phone
- avatar_url
- created_at
- updated_at

## debts

- id
- lender_id
- borrower_id
- amount
- remaining_amount
- currency
- note
- due_date
- status
- confirmation_status
- created_at
- updated_at

## payments

- id
- debt_id
- amount
- note
- paid_at
- created_at

## reminders

- id
- debt_id
- user_id
- type
- scheduled_at
- message
- status
- created_at

## push_subscriptions

- id
- user_id
- endpoint
- p256dh
- auth
- created_at

## telegram_connections

- id
- user_id
- telegram_id
- username
- created_at

## notifications

- id
- user_id
- type
- title
- body
- read
- created_at

Use foreign keys and indexes appropriately.

---

# 29. NESTJS ARCHITECTURE

Recommended modules:

```text
src/
  auth/
  users/
  debts/
  payments/
  reminders/
  notifications/
  push/
  telegram/
  ai/
  admin/
  database/
  common/
```

Keep domain logic separated.

Avoid giant modules and giant services.

---

# 30. REST API

Suggested endpoints:

## Auth

POST `/auth/register`
POST `/auth/login`
POST `/auth/otp`
POST `/auth/telegram`

## User

GET `/users/me`

## Debts

GET `/debts`
POST `/debts`
GET `/debts/:id`
PATCH `/debts/:id`
DELETE `/debts/:id`

## Payments

GET `/debts/:id/payments`
POST `/debts/:id/payments`

## Confirmation

POST `/debts/:id/confirm`

## Reminder

POST `/debts/:id/reminder`

## AI

POST `/ai/reminder`

## Notifications

GET `/notifications`

## Push

POST `/push/subscribe`
DELETE `/push/subscribe`

## Admin

GET `/admin/stats`
GET `/admin/users`
GET `/admin/reports`

Keep API naming consistent.

---

# 31. AUTHENTICATION

Support:

1. Phone/OTP authentication
2. Telegram Mini App authentication

Use secure server-side sessions/tokens.

Authentication must work consistently across PWA and Telegram Mini App.

---

# 32. SECURITY

Implement:

- server-side authentication
- server-side authorization
- input validation
- rate limiting where appropriate
- secure sessions/tokens
- protected admin routes
- secure Telegram initData verification
- push subscription validation
- database access controls
- privacy-aware logging

Never trust client-side role checks.

Never expose secrets.

Never commit `.env` files.

---

# 33. ENVIRONMENT VARIABLES

Frontend may contain only safe public variables such as:

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

Backend:

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

JWT_SECRET=

TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=

AI_API_KEY=
```

IMPORTANT:

Never expose:

- DATABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET
- TELEGRAM_BOT_TOKEN
- VAPID_PRIVATE_KEY
- AI_API_KEY

through `NEXT_PUBLIC_*`.

---

# 34. DESIGN SYSTEM

Visual direction:

- premium fintech
- modern
- minimal
- friendly
- trustworthy
- fast

References:

- Apple
- Stripe
- Linear
- Vercel
- Revolut
- Notion

Do not copy them.

Create original QarzDaftar branding.

---

# 35. COLORS

Primary:
`#2563EB`

Success:
`#10B981`

Warning:
`#F59E0B`

Danger:
`#EF4444`

Background:
`#F8FAFC`

Card:
`#FFFFFF`

Text:
`#0F172A`

Secondary text:
`#64748B`

Support both light and dark mode.

Do not make the entire UI black.

---

# 36. TYPOGRAPHY

Preferred font:

Inter

Must correctly render Uzbek Latin:

- o'
- g'
- sh
- ch
- q
- x

Use readable typography and proper hierarchy.

---

# 37. RESPONSIVE DESIGN

Primary breakpoints:

- 375px
- 390px
- 414px
- 768px
- 1024px
- 1440px

User App:
mobile-first

Telegram Mini App:
mobile-first

Admin:
desktop-first but responsive

---

# 38. USER NAVIGATION

Mobile:

- Home
- Qarzlar
- +
- Activity
- Profile

The `+` action should be visually prominent.

Telegram Mini App navigation should remain compact and suitable for Telegram's viewport.

---

# 39. ADMIN PANEL

Admin is separate from User App.

Screens:

- Dashboard
- Users
- Analytics
- Reports
- Notifications
- System Settings
- Admin Profile

Metrics:

- Total users
- New users
- Active users
- Total debts
- Paid debts
- Overdue debts
- AI reminder usage
- Push subscriptions
- Telegram connected users

Protect all admin routes on the backend.

Do not expose sensitive debt details unnecessarily.

---

# 40. EMPTY STATES

No debts:

Title:
`Hozircha qarzlar yo'q`

Description:
`Do'stingizga bergan yoki undan olgan qarzingizni shu yerda boshqaring.`

CTA:
`+ Birinchi qarzni qo'shish`

---

# 41. ERROR STATES

Never show raw technical errors.

Bad:
`ERR_DATABASE_500`

Good:
`Ma'lumotni saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.`

Every important screen should have:

- loading state
- empty state
- error state
- success feedback

---

# 42. UX PRINCIPLES

The product must be:

- simple
- fast
- clear
- mobile-first
- accessible
- trustworthy
- local to Uzbekistan

Avoid:

- excessive gradients
- excessive glassmorphism
- huge animations
- unnecessary decoration
- complicated navigation
- excessive cards
- generic dashboard layouts

Animations should be subtle.

Every action should have feedback.

Every form must validate input.

No fake buttons.

No fake production functionality.

---

# 43. DEVELOPMENT WORKFLOW

Before changing code:

1. Inspect repository.
2. Inspect package.json.
3. Understand frontend architecture.
4. Understand backend architecture.
5. Inspect routes.
6. Inspect components.
7. Inspect database setup.
8. Inspect auth.
9. Inspect PWA setup.
10. Inspect Telegram setup.
11. Reuse existing code where possible.

Do not rewrite the entire project unnecessarily.

Do not install unnecessary dependencies.

Implement the smallest complete version first.

After each feature:

1. run the project
2. check TypeScript
3. check console
4. test API
5. test mobile
6. check Uzbek text
7. check authorization
8. check privacy

---

# 44. MVP PHASES

## Phase 1 — Foundation

- Next.js setup
- NestJS setup
- Supabase connection
- database schema
- authentication foundation
- protected routes
- basic app shell

## Phase 2 — Core Debt

- dashboard
- debt list
- create debt
- debt detail
- edit/delete debt

## Phase 3 — Payments

- add payment
- partial payment
- installments
- remaining amount
- paid status

## Phase 4 — Confirmation

- secure confirmation link
- confirm/reject flow
- confirmation status

## Phase 5 — Notifications

- Web Push
- service worker
- push subscription
- reminder scheduler
- Telegram Bot notifications

## Phase 6 — Telegram Mini App

- Telegram WebApp detection
- initData verification
- Telegram authentication
- account linking
- Mini App UI polish

## Phase 7 — AI

- AI reminder generator
- tone selection
- editable result
- user confirmation before sending

## Phase 8 — Statistics

- personal statistics
- charts
- overdue analytics

## Phase 9 — Admin

- admin authentication
- dashboard
- users
- analytics
- reports
- settings

## Phase 10 — Production

- security audit
- performance
- responsive testing
- PWA testing
- Telegram Mini App testing
- Render deployment
- Supabase production configuration
- environment variables
- monitoring
- error handling

---

# 45. PRODUCTION QUALITY

Before calling a feature complete, verify:

- no TypeScript errors
- no console errors
- API errors handled
- authentication works
- authorization works
- mobile responsive
- Telegram viewport works
- PWA install works
- push permission works
- notification subscription works
- Telegram authentication is server-verified
- Uzbek text is correct
- UZS formatting is correct
- loading state works
- empty state works
- error state works
- privacy rules are respected
- no secrets exposed
- no unnecessary dependencies
- no fake functionality

The final application must feel like a real startup ready for users in Uzbekistan, not a generic AI-generated CRUD dashboard.

---

# 46. MASTER DEVELOPMENT PROMPT

When starting work, first read this entire CLAUDE.md.

DO NOT immediately rewrite the project.

First inspect the repository and report:

1. current stack
2. frontend structure
3. backend structure
4. database setup
5. authentication
6. PWA status
7. Telegram Mini App status
8. Web Push status
9. deployment configuration
10. reusable code
11. missing functionality
12. architectural risks

Then provide a step-by-step implementation plan.

WAIT FOR APPROVAL before making major architectural changes.

When implementation begins:

- follow this CLAUDE.md strictly
- keep frontend and backend separated
- use Next.js for frontend
- use NestJS for backend
- use Supabase PostgreSQL
- use Render for backend hosting
- use Web Push for PWA/browser
- use Telegram Bot for Telegram notifications
- reuse the same Next.js frontend for Telegram Mini App
- never create a separate Client Panel
- never expose secrets
- never fake production functionality
- never unnecessarily rewrite existing code
