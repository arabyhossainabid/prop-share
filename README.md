<div align="center">
  <img src="assets/header.png" alt="PropShare Banner" width="840">
</div>

# PropShare Backend API

PropShare Backend is a robust API powered by Node.js, Express, and Prisma, providing the foundation for fractional real estate investment, secure authentication, and property management.

## Live Links

- **Backend API:** [https://prop-share.onrender.com](https://prop-share.onrender.com)
- **Frontend App:** [https://propsphere.vercel.app](https://propsphere.vercel.app)

## Key Features

- **Secure Authentication:** Managed with BetterAuth.
- **Investment Management:** Fractional property ownership and tracking.
- **Payment Processing:** Integrated with Stripe (including webhooks).
- **Property Marketplace:** Category-based property listings with media support.
- **Community Engagement:** Voting (up/down) and hierarchical comment systems.
- **Admin & Management:** Full control over users, properties, and blogs.
- **Cloud Media Storage:** Cloudinary integration for property images.

## Technologies Used

- **Core:** Node.js, Express.js, TypeScript
- **Database:** Prisma ORM, PostgreSQL
- **Security:** BetterAuth, JWT, Bcrypt
- **Payments:** Stripe
- **File Uploads:** Multer, Cloudinary
- **Email:** Nodemailer

## Setup Instructions

1. **Clone & Install:**

   ```bash
   git clone https://github.com/arabyhossainabid/backend-prop-share.git
   cd backend-prop-share
   pnpm install
   ```

2. **Database Setup:**

   Ensure you have a PostgreSQL instance running and provide the `DATABASE_URL` in the `.env` file.

   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

3. **Environment Settings (`.env`):**

   Create a `.env` file in the root directory and configure the following:

   ```env
   # DATABASE_URL="your_postgresql_connection_string"
   ```

# --- Server Config ---

PORT=8080
NODE_ENV=development

# --- Authentication (JWT) ---

JWT_ACCESS_SECRET=your_super_secret_access_key_123
JWT_REFRESH_SECRET=your_super_secret_refresh_key_456
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# --- BetterAuth ---

BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:8080
BETTER_AUTH_TRUST_HOST=true

# --- Frontend Context ---

FRONTEND_URL=https://propsphere.vercel.app/

# --- Stripe (Payments) ---

STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=https://prop-share.onrender.com/api/v1/investments/webhook

# --- Cloudinary (Image Uploads) ---

CLOUDINARY_CLOUD_NAME=dswiaaos6
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

````

4. **Run Server:**

```bash
pnpm run dev
    ```

---

<div align="center">
  <sub>Engineered by <b>Araby Hossain Abid</b></sub>
</div>
