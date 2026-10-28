import type { EmailMessage } from '../auth/ports/mailer.js';

const ROLE_LABELS: Record<string, string> = {
  view: 'view',
  comment: 'comment on',
  edit: 'edit',
  full: 'manage',
};

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared branded layout: a card with a heading, paragraphs and one button. */
function layout(input: {
  preheader: string;
  heading: string;
  paragraphs: string[];
  button?: { label: string; url: string };
  footnote?: string;
}): { html: string; text: string } {
  const paragraphs = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:#3f3f50">${p}</p>`,
    )
    .join('');
  const button = input.button
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 24px"><tr><td style="border-radius:10px;background:#5b4cf0">
         <a href="${escape(input.button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${escape(input.button.label)}</a>
       </td></tr></table>
       <p style="margin:0 0 16px;font-size:12px;line-height:18px;color:#8a8a99">Or paste this link into your browser:<br><a href="${escape(input.button.url)}" style="color:#5b4cf0;word-break:break-all">${escape(input.button.url)}</a></p>`
    : '';
  const footnote = input.footnote
    ? `<p style="margin:16px 0 0;font-size:12px;line-height:18px;color:#8a8a99">${input.footnote}</p>`
    : '';

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${escape(input.preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f8;padding:32px 16px"><tr><td align="center">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px">
    <tr><td style="padding:0 4px 20px">
      <table role="presentation" cellspacing="0" cellpadding="0"><tr>
        <td style="width:28px;height:28px;border-radius:8px;background:#5b4cf0;color:#fff;font-weight:700;font-size:16px;text-align:center;line-height:28px">p</td>
        <td style="padding-left:8px;font-size:18px;font-weight:700;color:#1e1e2e">proarda</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e7e7ef">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:30px;color:#1e1e2e">${input.heading}</h1>
      ${paragraphs}${button}${footnote}
    </td></tr>
    <tr><td style="padding:20px 4px;font-size:12px;color:#8a8a99;text-align:center">proarda - documents, whiteboards and task boards in one live workspace.</td></tr>
  </table>
</td></tr></table></body></html>`;

  const strip = (value: string) =>
    value.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  const text = [
    strip(input.heading),
    '',
    ...input.paragraphs.map(strip),
    ...(input.button ? ['', `${input.button.label}: ${input.button.url}`] : []),
    ...(input.footnote ? ['', strip(input.footnote)] : []),
    '',
    '- proarda',
  ].join('\n');
  return { html, text };
}

export const emails = {
  passwordReset(to: string, resetUrl: string): EmailMessage {
    return {
      to,
      subject: 'Reset your proarda password',
      ...layout({
        preheader: 'Choose a new password for your account.',
        heading: 'Reset your password',
        paragraphs: [
          'We got a request to reset the password for your proarda account. The link works for 15 minutes.',
        ],
        button: { label: 'Choose a new password', url: resetUrl },
        footnote:
          "If you didn't ask for this, you can ignore this email - your password stays the same.",
      }),
    };
  },

  verifyEmail(to: string, name: string, verifyUrl: string): EmailMessage {
    return {
      to,
      subject: 'Welcome to proarda - confirm your email',
      ...layout({
        preheader: 'Confirm your email to finish setting up your account.',
        heading: `Welcome, ${escape(name)}!`,
        paragraphs: [
          'Thanks for joining proarda. Please confirm this is your email address - it lets teammates share pages with you directly.',
        ],
        button: { label: 'Confirm my email', url: verifyUrl },
        footnote: "If you didn't create an account, you can ignore this email.",
      }),
    };
  },

  invitation(input: {
    to: string;
    inviterName: string;
    scopeLabel: string;
    scopeKind: string;
    role: string;
    acceptUrl: string;
  }): EmailMessage {
    const what = `the ${input.scopeKind} <strong>${escape(input.scopeLabel)}</strong>`;
    return {
      to: input.to,
      subject: `${input.inviterName} invited you to "${input.scopeLabel}" on proarda`,
      ...layout({
        preheader: `${input.inviterName} invited you to collaborate on proarda.`,
        heading: "You've been invited",
        paragraphs: [
          `<strong>${escape(input.inviterName)}</strong> invited you to ${ROLE_LABELS[input.role] ?? 'view'} ${what}.`,
          "Accept the invitation to open it - you can create a free account in a few seconds if you don't have one yet.",
        ],
        button: { label: 'Accept invitation', url: input.acceptUrl },
        footnote: 'This invitation expires in 14 days.',
      }),
    };
  },

  sharedWithYou(input: {
    to: string;
    inviterName: string;
    scopeLabel: string;
    scopeKind: string;
    role: string;
    openUrl: string;
  }): EmailMessage {
    return {
      to: input.to,
      subject: `${input.inviterName} shared "${input.scopeLabel}" with you`,
      ...layout({
        preheader: `${input.inviterName} shared a ${input.scopeKind} with you.`,
        heading: `${escape(input.inviterName)} shared a ${input.scopeKind} with you`,
        paragraphs: [
          `You can now ${ROLE_LABELS[input.role] ?? 'view'} <strong>${escape(input.scopeLabel)}</strong>. It shows up in your sidebar.`,
        ],
        button: { label: `Open ${input.scopeKind}`, url: input.openUrl },
      }),
    };
  },

  passwordChanged(to: string, name: string, resetUrl: string): EmailMessage {
    return {
      to,
      subject: 'Your proarda password was changed',
      ...layout({
        preheader: 'Your password was just changed.',
        heading: 'Your password was changed',
        paragraphs: [
          `Hi ${escape(name)}, the password for your proarda account was just changed and your other devices were signed out.`,
          "If this wasn't you, reset your password right away.",
        ],
        button: { label: 'Reset password', url: resetUrl },
      }),
    };
  },
};
