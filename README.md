# PropShare – Fractional Real Estate Investment Platform Backend

This is a production-ready, high-performance Node.js backend for the PropShare platform. It is built using the **modern module-based architecture** inspired by professional healthcare management system patterns.

## Technology Stack
- **Runtime:** Node.js (v20+)
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Auth:** JWT (Standard & Refresh Tokens) with Cookies
- **Validation:** Zod
- **Payments:** Stripe

## Project Structure (MVC-Module Pattern)
```
src/
├── app/
│   ├── config/          # Environment & library configs
│   ├── errorHelpers/    # Error handling utilities
│   ├── interfaces/      # TypeScript interfaces
│   ├── lib/             # Third-party library singletons (Prisma, Stripe)
│   ├── middleware/      # Auth & Global Error handlers
│   ├── module/          # Domain-specific modules (Auth, Property, Investment, etc.)
│   │   └── auth/        # Controller, Service, Route, Validation
│   ├── routes/          # Centralized route index
│   ├── shared/          # Reusable helpers (catchAsync, sendResponse)
│   └── utils/           # Utility functions (JWT, Cookies, Seeding)
├── app.ts               # Express application setup
└── server.ts            # Server entry point & bootstrapping
```

## Completed Features
1. **Infrastructure Setup:** Express, TypeScript, and Prisma initialization.
2. **Database Design:** Robust PostgreSQL schema with relations for Users, Properties, Investments, and Transactions.
3. **Core Helpers:** Professional `catchAsync`, `sendResponse`, and `AppError` implementation.
4. **Global Error Handling:** Industry-standard error handling including Zod validation support.
5. **Auth Infrastructure:** JWT Utility (Access/Refresh), Cookie management, and `checkAuth` middleware for RBAC.
6. **Bootstrap & Seeding:** Super Admin seeding logic to ensure the system starts with an administrator.

## Remaining Tasks (Roadmap)
- [ ] **Auth Module:** Complete user registration, login, and "get me" functionality.
- [ ] **Property Module:** Full CRUD for Admin and filtered browsing for Users.
- [ ] **Investment Logic:** Atomic transactions to handle share purchases securely.
- [ ] **Payment Integration:** Stripe checkout system and webhook handling.
- [ ] **User Portfolio:** API to track investments and returns.
- [ ] **Admin Dashboard:** Stats and property moderation.
- [ ] **Bonus - Secondary Market:** Peer-to-peer share trading logic.
- [ ] **Bonus - Income Distribution:** Automatic rental income payouts.

## How to Setup locally

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Open `.env.example`, copy its content to a new `.env` file, and fill in your database and stripe credentials.

3. **Database Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Run in Development:**
   ```bash
   npm run dev
   ```

## Help Needed From User
To finalize the **Stripe Integration** and **Deployment**, please ensure you have:
1. A valid PostgreSQL database URL.
2. A Stripe Secret Key and Webhook Secret for testing.
