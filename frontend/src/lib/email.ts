const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "CBAM <noreply@ecosfer.com>";

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendInvitationEmail(
  to: string,
  supplierName: string,
  inviteUrl: string,
  lang: string = "tr"
): Promise<EmailResult> {
  const { subject, html } = getInvitationTemplate(supplierName, inviteUrl, lang);

  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEV] Invitation email would be sent to: ${to}`);
      console.log(`[DEV] Subject: ${subject}`);
    }
    return { success: true };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Email sending failed";
    return { success: false, error: message };
  }
}

function getInvitationTemplate(
  supplierName: string,
  inviteUrl: string,
  lang: string
): { subject: string; html: string } {
  const templates: Record<string, { subject: string; html: string }> = {
    tr: {
      subject: "CBAM Tedarikci Portali - Davet",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">CBAM Tedarikci Portali Daveti</h2>
          <p>Sayin ${supplierName},</p>
          <p>Ecosfer SKDM CBAM Tedarikci Portali'na davet edildiniz. Bu portal uzerinden emisyon verilerinizi paylasabilirsiniz.</p>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Portala Eris
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Bu link tek kullanimliktir. Hesabinizi olusturmak icin lutfen tiklayiniz.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Ecosfer SKDM Platform - CBAM Surdurulebilirlik Veri Yonetimi</p>
        </div>
      `,
    },
    en: {
      subject: "CBAM Supplier Portal - Invitation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">CBAM Supplier Portal Invitation</h2>
          <p>Dear ${supplierName},</p>
          <p>You have been invited to the Ecosfer SKDM CBAM Supplier Portal. You can share your emission data through this portal.</p>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Portal
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">This link is single-use. Please click to create your account.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Ecosfer SKDM Platform - CBAM Sustainability Data Management</p>
        </div>
      `,
    },
    de: {
      subject: "CBAM Lieferantenportal - Einladung",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">CBAM Lieferantenportal Einladung</h2>
          <p>Sehr geehrte/r ${supplierName},</p>
          <p>Sie wurden zum Ecosfer SKDM CBAM Lieferantenportal eingeladen. Uber dieses Portal konnen Sie Ihre Emissionsdaten teilen.</p>
          <div style="margin: 24px 0;">
            <a href="${inviteUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Portal aufrufen
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">Dieser Link ist einmalig verwendbar. Bitte klicken Sie, um Ihr Konto zu erstellen.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #999; font-size: 12px;">Ecosfer SKDM Platform - CBAM Nachhaltigkeitsdatenmanagement</p>
        </div>
      `,
    },
  };

  return templates[lang] || templates.en;
}
