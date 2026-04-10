# Supabase Email Templates Setup Guide

This guide walks you through configuring custom email templates in your Supabase project.

## Templates Overview

| Template | File | Supabase Template Name |
|----------|------|----------------------|
| Email Verification | `email-verification.html` | Confirm signup |
| Password Reset | `password-reset.html` | Reset password |
| Magic Link | `magic-link.html` | Magic link |
| Invite User | `invite-user.html` | Invite user |
| Email Change | `email-change.html` | Change email address |

## Setup Steps

### 1. Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your WeduPay project
3. Navigate to **Authentication** → **Email Templates**

### 2. Configure Each Template

For each template below:
1. Click the template name in the list
2. Switch to **HTML** editor mode
3. Copy the entire contents of the corresponding `.html` file
4. Paste into the editor
5. Click **Save**

### 3. Template Variables Reference

Supabase injects these variables at send time:

**Confirm Signup:**
- `{{ .ConfirmationURL }}` - The URL to confirm the user's email
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed version of the token
- `{{ .RedirectTo }}` - Where to redirect after confirmation
- `{{ .Email }}` - User's email address

**Reset Password:**
- `{{ .RecoveryURL }}` - URL to reset password
- `{{ .Token }}` - The reset token
- `{{ .TokenHash }}` - Hashed version
- `{{ .RedirectTo }}` - Post-reset redirect
- `{{ .Email }}` - User's email

**Magic Link:**
- `{{ .ConfirmationURL }}` - The magic link URL
- `{{ .Token }}` - The magic link token
- `{{ .TokenHash }}` - Hashed version
- `{{ .RedirectTo }}` - Post-login redirect
- `{{ .Email }}` - User's email

**Invite User:**
- `{{ .InviteURL }}` - URL to accept invitation
- `{{ .Token }}` - The invite token
- `{{ .TokenHash }}` - Hashed version
- `{{ .RedirectTo }}` - Post-acceptance redirect
- `{{ .Email }}` - Invited user's email

**Change Email:**
- `{{ .ConfirmationURL }}` - URL to confirm email change
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed version
- `{{ .RedirectTo }}` - Post-confirmation redirect
- `{{ .Email }}` - User's email

### 4. Update Template Files

The template files use generic placeholders like `{{verificationUrl}}`. Replace them with actual Supabase variables:

**In `email-verification.html`:**
- Replace `{{verificationUrl}}` with `{{ .ConfirmationURL }}`
- Replace `{{verificationCode}}` with `{{ .Token }}`
- Replace `{{helpUrl}}` with your support URL or `{{ .RedirectTo }}`

**In `password-reset.html`:**
- Replace `{{resetUrl}}` with `{{ .RecoveryURL }}`
- Replace `{{email}}` with `{{ .Email }}`

**In `magic-link.html`:**
- Replace `{{magicLinkUrl}}` with `{{ .ConfirmationURL }}`
- Replace `{{email}}` with `{{ .Email }}`

**In `invite-user.html`:**
- Replace `{{inviteUrl}}` with `{{ .InviteURL }}`
- Replace `{{orgName}}` with your workspace name
- Replace `{{invitedBy}}` with the inviter's name/email
- Replace `{{role}}` with the assigned role
- Replace `{{email}}` with `{{ .Email }}`

**In `email-change.html`:**
- Replace `{{confirmationUrl}}` with `{{ .ConfirmationURL }}`
- Replace `{{currentEmail}}` with the old email (manual reference)
- Replace `{{newEmail}}` with `{{ .Email }}`

### 5. Configure Email Settings

In Supabase Dashboard → **Authentication** → **Settings**:

1. **Site URL**: Set to `https://wedupay.com`
2. **Redirect URLs**: Add:
   - `https://wedupay.com/auth/callback`
   - `https://wedupay.com/auth/reset-password`
   - `http://localhost:3000/auth/callback` (for local dev)
3. **Email Auth**:
   - Enable email confirmations (toggle ON)
   - Set secure cookie change (toggle ON)

### 6. SMTP Configuration (Optional)

By default, Supabase sends emails via their shared service. For production:

1. Go to **Project Settings** → **Email Templates** → **SMTP Configuration**
2. Configure your own SMTP provider (SendGrid, Postmark, Resend, etc.)
3. Set "Sender Email" to `noreply@wedupay.com` or your domain

## Quick Copy Commands

Each template is ready in `src/emails/`. Copy the raw HTML and paste into Supabase:

```bash
# View template content for copying
cat src/emails/email-verification.html
cat src/emails/password-reset.html
cat src/emails/magic-link.html
cat src/emails/invite-user.html
cat src/emails/email-change.html
```
