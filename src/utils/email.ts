import nodemailer from "nodemailer";

export interface BookingNotificationDetails {
  id: string;
  serviceName: string;
  practitionerName: string;
  date: string;
  timeSlot: string;
  price: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  paymentId?: string;
}

/**
 * Sends an email notification to the Admin upon successful booking payment
 */
export async function sendAdminBookingNotification(booking: BookingNotificationDetails) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@divingsanatan.com";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 587;
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";

  const subject = `✨ New Session Booking: ${booking.serviceName} - ${booking.clientName} (₹${booking.price})`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f1fa; padding: 24px; color: #1e1b4b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e9d5ff; box-shadow: 0 4px 20px rgba(124, 58, 237, 0.08);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4c1d95; font-size: 24px; margin: 0;">🔮 Diving Sanatan</h1>
          <p style="color: #6d28d9; font-size: 14px; font-weight: bold; margin-top: 4px;">New Paid Booking Received!</p>
        </div>

        <div style="background: #fcfaff; border: 1px solid rgba(124, 58, 237, 0.15); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="font-size: 18px; color: #1e1b4b; margin-top: 0;">${booking.serviceName}</h2>
          <p style="margin: 4px 0; color: #6d28d9; font-weight: bold;">Guided by: ${booking.practitionerName}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold; width: 40%;">Client Name:</td>
            <td style="padding: 8px 0; color: #1e1b4b; font-weight: bold;">${booking.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Client Email:</td>
            <td style="padding: 8px 0; color: #1e1b4b;"><a href="mailto:${booking.clientEmail}" style="color: #7c3aed;">${booking.clientEmail}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Client Phone:</td>
            <td style="padding: 8px 0; color: #1e1b4b;">${booking.clientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Appointment Date:</td>
            <td style="padding: 8px 0; color: #1e1b4b;">📅 ${booking.date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Time Slot:</td>
            <td style="padding: 8px 0; color: #1e1b4b;">⏰ ${booking.timeSlot}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Amount Paid:</td>
            <td style="padding: 8px 0; color: #b45309; font-weight: bold; font-size: 16px;">₹${booking.price}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Booking ID:</td>
            <td style="padding: 8px 0; color: #475569; font-family: monospace;">${booking.id}</td>
          </tr>
          ${
            booking.paymentId
              ? `<tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Razorpay Payment ID:</td>
            <td style="padding: 8px 0; color: #047857; font-family: monospace; font-weight: bold;">${booking.paymentId}</td>
          </tr>`
              : ""
          }
        </table>

        ${
          booking.notes
            ? `<div style="background: #f8fafc; border-left: 4px solid #7c3aed; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
          <strong style="color: #4c1d95;">Somatic Notes:</strong>
          <p style="margin: 4px 0 0 0; color: #334155;">${booking.notes}</p>
        </div>`
            : ""
        }

        <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 12px; color: #94a3b8;">
          Automated Admin Notification System — Diving Sanatan Wellness Portal
        </div>
      </div>
    </div>
  `;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"Diving Sanatan Bookings" <${smtpUser}>`,
        to: adminEmail,
        subject,
        html: htmlContent,
      });

      console.log(`[EMAIL SUCCESS] Admin booking notification sent to ${adminEmail}`);
      return { success: true, emailSent: true };
    } catch (err: any) {
      console.error("[EMAIL ERROR] Failed to send admin notification email:", err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`
========================================================================
[ADMIN EMAIL NOTIFICATION SIMULATION]
------------------------------------------------------------------------
To: ${adminEmail}
Subject: ${subject}
Booking Details:
- Client: ${booking.clientName} (${booking.clientEmail}, ${booking.clientPhone})
- Service: ${booking.serviceName} with ${booking.practitionerName}
- Date/Time: ${booking.date} at ${booking.timeSlot}
- Amount: ₹${booking.price}
- Booking ID: ${booking.id}
- Payment ID: ${booking.paymentId || "N/A"}
========================================================================
    `);
    return { success: true, emailSent: false, simulated: true };
  }
}
