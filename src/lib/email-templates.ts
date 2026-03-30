import fs from "fs";
import path from "path";

interface EmailTemplate {
  waitlistConfirmation: (data: { type: string; position: number; dashboardUrl: string; helpUrl: string }) => string;
  emailVerification: (data: { verificationCode: string; verificationUrl: string; helpUrl: string }) => string;
  waitlistNotification: (data: { email: string; type: string; name: string; totalWaitlist: number; adminUrl: string; helpUrl: string }) => string;
}

function loadTemplate(templateName: string): string {
  const templatePath = path.join(process.cwd(), "src", "emails", `${templateName}.html`);
  return fs.readFileSync(templatePath, "utf-8");
}

function replacePlaceholders(template: string, data: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match;
  });
}

export const emailTemplates: EmailTemplate = {
  waitlistConfirmation: (data) => {
    const template = loadTemplate("waitlist-confirmation");
    return replacePlaceholders(template, {
      type: data.type,
      position: data.position,
      dashboardUrl: data.dashboardUrl,
      helpUrl: data.helpUrl || "https://wedupay.com/help",
    });
  },

  emailVerification: (data) => {
    const template = loadTemplate("email-verification");
    return replacePlaceholders(template, {
      verificationCode: data.verificationCode,
      verificationUrl: data.verificationUrl,
      helpUrl: data.helpUrl || "https://wedupay.com/help",
    });
  },

  waitlistNotification: (data) => {
    const template = loadTemplate("waitlist-notification");
    return replacePlaceholders(template, {
      email: data.email,
      type: data.type,
      name: data.name || "Not provided",
      totalWaitlist: data.totalWaitlist,
      adminUrl: data.adminUrl,
      helpUrl: data.helpUrl || "https://wedupay.com/help",
    });
  },
};
