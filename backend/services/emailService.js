/**
 * Email notification service. Logs by default; can send real emails if SMTP env is set.
 * Usage: await emailService.sendLoanRequestNotification(customerEmail, vendorName);
 */
const User = require("../models/User");

async function sendLoanRequestNotification(customerEmail, vendorName) {
  const subject = "CodeX: New loan connection request";
  const text = `A vendor (${vendorName}) has sent you a loan connection request. Log in to your customer dashboard to accept or reject.`;
  const html = `<p>A vendor (<strong>${vendorName}</strong>) has sent you a loan connection request.</p><p>Log in to your <a href="${process.env.FRONTEND_URL || "http://localhost:3001"}/customer">customer dashboard</a> to accept or reject.</p>`;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const nodemailer = require("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: customerEmail,
        subject,
        text,
        html,
      });
      console.log(`[Email] Loan request notification sent to ${customerEmail}`);
    } catch (err) {
      console.error("[Email] Failed to send loan request notification:", err.message);
    }
  } else {
    console.log(`[Email stub] Loan request notification for ${customerEmail} from ${vendorName}: ${text}`);
  }
}

module.exports = {
  sendLoanRequestNotification,
};
