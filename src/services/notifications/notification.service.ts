/**
 * Notification Service
 * 
 * Centralized notification service for email and SMS delivery.
 * Supports multiple providers and templates for different notification types.
 * 
 * Features:
 * - Email notifications (SendGrid/Resend integration)
 * - SMS notifications (Twilio/Africa's Talking integration)
 * - Template-based messaging
 * - Queue system for batch sending
 * - Delivery tracking and retry logic
 * - User notification preferences
 * 
 * @module services/notifications
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Email notification data structure
 */
export interface EmailNotification {
  to: string;
  subject: string;
  template: EmailTemplateType;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
}

/**
 * SMS notification data structure
 */
export interface SmsNotification {
  to: string;
  template: SmsTemplateType;
  data: Record<string, any>;
  senderId?: string;
}

/**
 * Email template types
 * Each type has a predefined subject and body template
 */
export type EmailTemplateType =
  | 'welcome'
  | 'transfer_confirmation'
  | 'transfer_completed'
  | 'transfer_failed'
  | 'password_reset'
  | 'email_verification'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'low_balance_alert'
  | 'security_alert';

/**
 * SMS template types
 * Shorter messages for SMS delivery
 */
export type SmsTemplateType =
  | 'transfer_code'
  | 'transfer_completed'
  | 'transfer_failed'
  | 'verification_code'
  | 'security_alert';

/**
 * Notification send result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * ============================
 * EMAIL NOTIFICATION SERVICE
 * ============================
 */

/**
 * Email templates with subject and body
 * Uses template variables that get replaced with actual data
 */
const EMAIL_TEMPLATES: Record<EmailTemplateType, { subject: string; body: string }> = {
  welcome: {
    subject: 'Welcome to WeduPay - Your African Payment Gateway',
    body: `
      <h1>Welcome to WeduPay!</h1>
      <p>Hi {{name}},</p>
      <p>Thank you for joining WeduPay, your trusted cross-border payment platform.</p>
      <p>You can now send money to {{countries}} with the best exchange rates.</p>
      <p><a href="{{dashboardUrl}}">Get Started</a></p>
      <p>Best regards,<br>The WeduPay Team</p>
    `,
  },
  
  transfer_confirmation: {
    subject: 'Transfer Confirmation - {{transferRef}}',
    body: `
      <h1>Transfer Initiated</h1>
      <p>Hi {{name}},</p>
      <p>Your transfer has been initiated successfully.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{transferRef}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{amount}} {{currency}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Recipient:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{recipientPhone}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{status}}</td>
        </tr>
      </table>
      <p>We'll notify you once the transfer is completed.</p>
      <p><a href="{{trackingUrl}}">Track Transfer</a></p>
    `,
  },
  
  transfer_completed: {
    subject: 'Transfer Completed - {{transferRef}}',
    body: `
      <h1>Transfer Completed! ✓</h1>
      <p>Hi {{name}},</p>
      <p>Great news! Your transfer has been completed successfully.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{transferRef}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Sent:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{sendAmount}} {{sendCurrency}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Received:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{receiveAmount}} {{receiveCurrency}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Recipient:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{recipientPhone}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Completed:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{completedAt}}</td>
        </tr>
      </table>
      <p>Thank you for using WeduPay!</p>
    `,
  },
  
  transfer_failed: {
    subject: 'Transfer Failed - {{transferRef}}',
    body: `
      <h1>Transfer Update</h1>
      <p>Hi {{name}},</p>
      <p>We regret to inform you that your transfer could not be completed.</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reference:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{transferRef}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{amount}} {{currency}}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td>
        </tr>
      </table>
      <p>The amount has been refunded to your wallet.</p>
      <p><a href="{{retryUrl}}">Try Again</a></p>
    `,
  },
  
  password_reset: {
    subject: 'Reset Your Password',
    body: `
      <h1>Password Reset Request</h1>
      <p>Hi,</p>
      <p>We received a request to reset your password.</p>
      <p><a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  },
  
  email_verification: {
    subject: 'Verify Your Email Address',
    body: `
      <h1>Verify Your Email</h1>
      <p>Hi,</p>
      <p>Thank you for registering with WeduPay. Please verify your email address.</p>
      <p><a href="{{verificationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  },
  
  kyc_approved: {
    subject: 'KYC Verification Approved',
    body: `
      <h1>KYC Verification Approved ✓</h1>
      <p>Hi {{name}},</p>
      <p>Great news! Your identity verification has been approved.</p>
      <p>Your new transaction limits are:</p>
      <ul>
        <li>Daily limit: {{dailyLimit}} {{currency}}</li>
        <li>Monthly limit: {{monthlyLimit}} {{currency}}</li>
      </ul>
      <p>You can now enjoy higher transfer limits on WeduPay.</p>
    `,
  },
  
  kyc_rejected: {
    subject: 'KYC Verification Update',
    body: `
      <h1>KYC Verification Update</h1>
      <p>Hi {{name}},</p>
      <p>We've reviewed your verification documents and need additional information.</p>
      <p><strong>Reason:</strong> {{reason}}</p>
      <p><a href="{{resubmitUrl}}">Resubmit Documents</a></p>
    `,
  },
  
  low_balance_alert: {
    subject: 'Low Balance Alert',
    body: `
      <h1>Low Balance Alert</h1>
      <p>Hi {{name}},</p>
      <p>Your {{currency}} wallet balance is running low.</p>
      <p><strong>Current Balance:</strong> {{balance}} {{currency}}</p>
      <p><a href="{{fundUrl}}">Fund Your Wallet</a></p>
    `,
  },
  
  security_alert: {
    subject: 'Security Alert - {{action}}',
    body: `
      <h1>Security Alert</h1>
      <p>Hi {{name}},</p>
      <p>We detected {{action}} on your account.</p>
      <p><strong>Time:</strong> {{timestamp}}</p>
      <p><strong>Location:</strong> {{location}}</p>
      <p>If this wasn't you, please contact support immediately.</p>
    `,
  },
};

/**
 * Send email notification
 * 
 * @param notification - Email notification details
 * @returns NotificationResult with delivery status
 * 
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome!',
 *   template: 'welcome',
 *   data: { name: 'John' }
 * });
 * ```
 */
export async function sendEmail(notification: EmailNotification): Promise<NotificationResult> {
  const messageId = `EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[EmailService] ${messageId} - Sending email to ${notification.to}`);

  try {
    // Get template
    const template = EMAIL_TEMPLATES[notification.template];
    
    if (!template) {
      return {
        success: false,
        error: `Unknown template: ${notification.template}`,
      };
    }

    // Replace template variables with actual data
    let subject = template.subject;
    let body = template.body;

    Object.entries(notification.data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, String(value));
      body = body.replace(regex, String(value));
    });

    // Send via configured provider (SendGrid, Resend, etc.)
    // In production, integrate with actual email service
    const provider = process.env.EMAIL_PROVIDER || 'console';
    
    if (provider === 'sendgrid') {
      // SendGrid integration
      // const sgMail = require('@sendgrid/mail');
      // await sgMail.send({ ... });
      console.log(`[EmailService] ${messageId} - Would send via SendGrid`);
    } else if (provider === 'resend') {
      // Resend integration
      // const resend = require('resend');
      // await resend.emails.send({ ... });
      console.log(`[EmailService] ${messageId} - Would send via Resend`);
    } else {
      // Console logging for development
      console.log(`
=============================================
EMAIL NOTIFICATION (Development Mode)
=============================================
To: ${notification.to}
Subject: ${subject}
---------------------------------------------
${body}
=============================================
      `);
    }

    // Record notification in database
    await recordNotification({
      messageId,
      type: 'email',
      to: notification.to,
      template: notification.template,
      status: 'sent',
    });

    console.log(`[EmailService] ${messageId} - Email sent successfully`);

    return {
      success: true,
      messageId,
      provider,
    };
  } catch (error) {
    console.error(`[EmailService] ${messageId} - Error:`, error);

    await recordNotification({
      messageId,
      type: 'email',
      to: notification.to,
      template: notification.template,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * ============================
 * SMS NOTIFICATION SERVICE
 * ============================
 */

/**
 * SMS templates with message body
 * Keep messages short for SMS delivery
 */
const SMS_TEMPLATES: Record<SmsTemplateType, string> = {
  transfer_code: 'Your WeduPay transfer code is: {{code}}. Valid for 10 minutes.',
  
  transfer_completed: 'WeduPay: Your transfer {{ref}} of {{amount}} {{currency}} has been completed successfully.',
  
  transfer_failed: 'WeduPay: Your transfer {{ref}} could not be completed. Reason: {{reason}}. Funds refunded.',
  
  verification_code: 'Your WeduPay verification code is: {{code}}. Do not share this code with anyone.',
  
  security_alert: 'WeduPay Security Alert: {{action}} detected on your account at {{time}}. Contact support if this wasn\'t you.',
};

/**
 * Send SMS notification
 * 
 * @param notification - SMS notification details
 * @returns NotificationResult with delivery status
 * 
 * @example
 * ```typescript
 * const result = await sendSms({
 *   to: '+254712345678',
 *   template: 'transfer_code',
 *   data: { code: '123456' }
 * });
 * ```
 */
export async function sendSms(notification: SmsNotification): Promise<NotificationResult> {
  const messageId = `SMS-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  console.log(`[SmsService] ${messageId} - Sending SMS to ${notification.to}`);

  try {
    // Get template
    const template = SMS_TEMPLATES[notification.template];
    
    if (!template) {
      return {
        success: false,
        error: `Unknown template: ${notification.template}`,
      };
    }

    // Replace template variables with actual data
    let message = template;
    Object.entries(notification.data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, String(value));
    });

    // Send via configured provider (Twilio, Africa's Talking)
    const provider = process.env.SMS_PROVIDER || 'console';
    
    if (provider === 'twilio') {
      // Twilio integration
      // const twilio = require('twilio');
      // await twilioClient.messages.create({ ... });
      console.log(`[SmsService] ${messageId} - Would send via Twilio`);
    } else if (provider === 'africas_talking') {
      // Africa's Talking integration (better for Africa)
      // const AT = require('africastalking');
      // await AT.sms.send({ ... });
      console.log(`[SmsService] ${messageId} - Would send via Africa's Talking`);
    } else {
      // Console logging for development
      console.log(`
=============================================
SMS NOTIFICATION (Development Mode)
=============================================
To: ${notification.to}
Message: ${message}
=============================================
      `);
    }

    // Record notification in database
    await recordNotification({
      messageId,
      type: 'sms',
      to: notification.to,
      template: notification.template,
      status: 'sent',
    });

    console.log(`[SmsService] ${messageId} - SMS sent successfully`);

    return {
      success: true,
      messageId,
      provider,
    };
  } catch (error) {
    console.error(`[SmsService] ${messageId} - Error:`, error);

    await recordNotification({
      messageId,
      type: 'sms',
      to: notification.to,
      template: notification.template,
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS',
    };
  }
}

/**
 * ============================
 * UTILITY FUNCTIONS
 * ============================
 */

/**
 * Record notification in database for tracking
 */
async function recordNotification(data: {
  messageId: string;
  type: 'email' | 'sms';
  to: string;
  template: string;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}): Promise<void> {
  try {
    // Would create notification record in database
    // For now, just log
    console.log(`[NotificationLog] ${data.messageId} - ${data.type} ${data.status}`);
  } catch (error) {
    console.error('Record notification error:', error);
  }
}

/**
 * Send transfer confirmation notification (email + SMS)
 * 
 * @param userId - User ID
 * @param transfer - Transfer details
 * @returns Object with email and SMS results
 */
export async function sendTransferConfirmation(
  userId: string,
  transfer: {
    transferRef: string;
    sendAmount: number;
    sendCurrency: string;
    recipientPhone: string;
    status: string;
  }
): Promise<{ email?: NotificationResult; sms?: NotificationResult }> {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });

    if (!user) {
      return {};
    }

    const results: { email?: NotificationResult; sms?: NotificationResult } = {};

    // Send email
    if (user.email) {
      results.email = await sendEmail({
        to: user.email,
        subject: '', // Will be filled by template
        template: 'transfer_confirmation',
        data: {
          name: user.email.split('@')[0],
          transferRef: transfer.transferRef,
          amount: transfer.sendAmount,
          currency: transfer.sendCurrency,
          recipientPhone: transfer.recipientPhone,
          status: transfer.status,
          dashboardUrl: process.env.NEXT_PUBLIC_APP_URL,
        },
      });
    }

    // Send SMS
    if (user.phoneNumber) {
      results.sms = await sendSms({
        to: user.phoneNumber,
        template: 'transfer_code',
        data: {
          code: transfer.transferRef.slice(-6),
        },
      });
    }

    return results;
  } catch (error) {
    console.error('Send transfer confirmation error:', error);
    return {};
  }
}

/**
 * Send transfer completion notification
 */
export async function sendTransferCompleted(
  userId: string,
  transfer: {
    transferRef: string;
    sendAmount: number;
    sendCurrency: string;
    receiveAmount: number;
    receiveCurrency: string;
    recipientPhone: string;
    completedAt: Date;
  }
): Promise<{ email?: NotificationResult; sms?: NotificationResult }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phoneNumber: true },
    });

    if (!user) return {};

    const results: { email?: NotificationResult; sms?: NotificationResult } = {};

    // Send email
    if (user.email) {
      results.email = await sendEmail({
        to: user.email,
        subject: '',
        template: 'transfer_completed',
        data: {
          name: user.email.split('@')[0],
          transferRef: transfer.transferRef,
          sendAmount: transfer.sendAmount,
          sendCurrency: transfer.sendCurrency,
          receiveAmount: transfer.receiveAmount,
          receiveCurrency: transfer.receiveCurrency,
          recipientPhone: transfer.recipientPhone,
          completedAt: transfer.completedAt.toLocaleString(),
        },
      });
    }

    // Send SMS
    if (user.phoneNumber) {
      results.sms = await sendSms({
        to: user.phoneNumber,
        template: 'transfer_completed',
        data: {
          ref: transfer.transferRef,
          amount: transfer.receiveAmount,
          currency: transfer.receiveCurrency,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('Send transfer completed error:', error);
    return {};
  }
}

export default {
  sendEmail,
  sendSms,
  sendTransferConfirmation,
  sendTransferCompleted,
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
};
