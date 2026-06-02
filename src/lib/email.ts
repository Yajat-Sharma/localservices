import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    await transporter.sendMail({
      from: `"LocalServices" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Email send error:", err);
    // Don't throw — email failure shouldn't break the API
  }
}

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  padding: 0;
  margin: 0;
`;

const card = `
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 520px;
  margin: 32px auto;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
`;

const logo = `
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
`;

const badge = (color: string) => `
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: ${color};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
`;

const btn = (color = "#7c3aed") => `
  display: inline-block;
  background: linear-gradient(135deg, ${color}, #ec4899);
  color: white;
  text-decoration: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 15px;
  margin-top: 20px;
`;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://localservices-five.vercel.app";

export const emailTemplates = {
  /** Alert sent to ADMIN when provider uploads a document */
  docSubmitted: (providerName: string, businessName: string, docType: string) => ({
    subject: `📄 New Document Uploaded — ${businessName}`,
    html: `
      <div style="${baseStyle}">
        <div style="${card}">
          <div style="${logo}">
            <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:18px;">🏠</span>
            </div>
            <span style="font-size:20px;font-weight:900;color:#0f172a;">Local<span style="color:#7c3aed;">Services</span></span>
          </div>

          <span style="${badge("#fef3c7;color:#92400e;")}">ACTION REQUIRED</span>

          <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:16px 0 8px;">New Document Awaiting Review</h2>
          <p style="color:#64748b;margin:0 0 20px;line-height:1.6;">
            A provider has uploaded a new document for verification. Please review it in the admin panel.
          </p>

          <div style="background:#f8fafc;border-radius:12px;padding:16px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:13px;">Provider</span>
              <span style="color:#0f172a;font-weight:600;font-size:13px;">${providerName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e2e8f0;">
              <span style="color:#94a3b8;font-size:13px;">Business</span>
              <span style="color:#0f172a;font-weight:600;font-size:13px;">${businessName}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;">
              <span style="color:#94a3b8;font-size:13px;">Document</span>
              <span style="color:#7c3aed;font-weight:700;font-size:13px;">${docType}</span>
            </div>
          </div>

          <a href="${APP_URL}/admin" style="${btn()}">Review in Admin Panel →</a>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            This is an automated alert from LocalServices.
          </p>
        </div>
      </div>
    `,
  }),

  /** Email sent to PROVIDER when their document is approved */
  docApproved: (providerName: string, docType: string, bothApproved: boolean) => ({
    subject: bothApproved
      ? "🎉 You're now Verified on LocalServices!"
      : `✅ Your ${docType} has been approved`,
    html: `
      <div style="${baseStyle}">
        <div style="${card}">
          <div style="${logo}">
            <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:18px;">🏠</span>
            </div>
            <span style="font-size:20px;font-weight:900;color:#0f172a;">Local<span style="color:#7c3aed;">Services</span></span>
          </div>

          <div style="text-align:center;padding:16px 0;">
            <div style="font-size:56px;margin-bottom:12px;">${bothApproved ? "🏆" : "✅"}</div>
            <span style="${badge("#d1fae5;color:#065f46;")}">APPROVED</span>
            <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:16px 0 8px;">
              ${bothApproved ? "Congratulations, you're Verified!" : `Your ${docType} was approved`}
            </h2>
            <p style="color:#64748b;line-height:1.6;">
              Hi ${providerName}, ${bothApproved
                ? "all your documents have been verified! Your profile now shows the ✓ Verified badge, giving customers extra confidence to book you."
                : `your ${docType} has been reviewed and approved by our team.`
              }
            </p>
          </div>

          ${bothApproved ? `
          <div style="background:linear-gradient(135deg,rgba(124,58,237,0.06),rgba(236,72,153,0.04));border-radius:12px;padding:16px;margin:16px 0;border:1px solid rgba(124,58,237,0.1);">
            <p style="font-weight:700;color:#0f172a;margin:0 0 10px;">What the ✓ Verified badge means:</p>
            <ul style="color:#64748b;font-size:13px;padding-left:20px;margin:0;line-height:2;">
              <li>Customers see you as a trusted professional</li>
              <li>Higher ranking in search results</li>
              <li>Access to premium booking features</li>
            </ul>
          </div>` : ""}

          <a href="${APP_URL}/provide/dashboard" style="${btn()}">View Your Dashboard →</a>
        </div>
      </div>
    `,
  }),

  /** Email sent to PROVIDER when their document is rejected */
  docRejected: (providerName: string, docType: string, reason: string) => ({
    subject: `❌ Your ${docType} could not be approved`,
    html: `
      <div style="${baseStyle}">
        <div style="${card}">
          <div style="${logo}">
            <div style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#7c3aed,#ec4899);display:flex;align-items:center;justify-content:center;">
              <span style="color:white;font-size:18px;">🏠</span>
            </div>
            <span style="font-size:20px;font-weight:900;color:#0f172a;">Local<span style="color:#7c3aed;">Services</span></span>
          </div>

          <span style="${badge("#fee2e2;color:#991b1b;")}">ACTION NEEDED</span>

          <h2 style="color:#0f172a;font-size:22px;font-weight:800;margin:16px 0 8px;">
            Document Not Approved
          </h2>
          <p style="color:#64748b;line-height:1.6;">
            Hi ${providerName}, unfortunately your <strong>${docType}</strong> could not be approved at this time.
          </p>

          <div style="background:#fff1f2;border-left:4px solid #ef4444;border-radius:0 12px 12px 0;padding:14px 16px;margin:20px 0;">
            <p style="font-weight:700;color:#991b1b;margin:0 0 6px;font-size:13px;">REASON</p>
            <p style="color:#7f1d1d;margin:0;line-height:1.5;">${reason || "The document was unclear or invalid. Please upload a new one."}</p>
          </div>

          <p style="color:#64748b;line-height:1.6;">
            Don't worry — you can re-upload your document from your provider dashboard. Our team will review it again within 24 hours.
          </p>

          <a href="${APP_URL}/provide/dashboard" style="${btn("#dc2626")}">Re-upload Document →</a>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            If you believe this was a mistake, please reply to this email.
          </p>
        </div>
      </div>
    `,
  }),
};
