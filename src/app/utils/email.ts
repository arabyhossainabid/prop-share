import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const fromAddress =
  process.env.SMTP_FROM || `"PropShare" <${process.env.SMTP_USER}>`;

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
  name?: string
): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Password Reset Request – PropShare',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">Password Reset Request</h2>
        <p>Hello ${name || 'User'},</p>
        <p>We received a request to reset the password for your PropShare account.</p>
        <p>Click the button below to set a new password. <strong>This link expires in 1 hour.</strong></p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:20px 0;padding:12px 28px;background:#16a34a;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:bold;">
          Reset Password
        </a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#666;">The PropShare Team</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name?: string
): Promise<void> => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Welcome to PropShare!',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">Welcome to PropShare 🎉</h2>
        <p>Hello ${name || 'User'},</p>
        <p>Your account has been created successfully. You can now start investing in fractional real estate.</p>
        <p>Visit your dashboard to explore available properties.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="font-size:12px;color:#666;">The PropShare Team</p>
      </div>
    `,
  });
};
