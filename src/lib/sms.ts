import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  try {
    // Format Indian numbers
    let phone = to.replace(/\s/g, "");
    if (!phone.startsWith("+")) {
      phone = phone.startsWith("91") ? `+${phone}` : `+91${phone}`;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`SMS sent to ${phone}`);
  } catch (err) {
    console.error("SMS error:", err);
    // Don't throw — SMS failure shouldn't break the app
  }
}

export const SMS_TEMPLATES = {
  newBooking: (customerName: string, service: string) =>
    `🔔 LocalServices: New booking from ${customerName} for ${service}! Open app to accept. Reply STOP to unsubscribe.`,

  bookingAccepted: (providerName: string, service: string) =>
    `✅ LocalServices: Your ${service} booking with ${providerName} has been accepted! They will contact you soon.`,

  bookingStarted: (providerName: string) =>
    `🚀 LocalServices: ${providerName} has started your service. They are on their way!`,

  bookingCompleted: (providerName: string, service: string) =>
    `⭐ LocalServices: Your ${service} by ${providerName} is complete! Please rate your experience in the app.`,

  bookingCancelled: (service: string) =>
    `❌ LocalServices: Your ${service} booking has been cancelled. Book again at localservices-five.vercel.app`,

  bookingReminder: (providerName: string, date: string, time: string) =>
    `📅 LocalServices: Reminder! Your booking with ${providerName} is scheduled for ${date} at ${time}.`,
};