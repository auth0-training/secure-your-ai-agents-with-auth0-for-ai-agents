import { tool } from 'ai';
import { z } from 'zod';
import { google } from 'googleapis';
import { withGmailRead, withGmailWrite, getAccessToken } from '../lib/auth0-ai.js';

function gmailClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.gmail({ version: 'v1', auth });
}

export const gmailSearchTool = withGmailRead(
  tool({
    description:
      "Search the user's Gmail inbox. Use Gmail search operators for precision (e.g. 'from:alice@example.com', 'subject:invoice', 'is:unread', 'after:2024/01/01').",
    inputSchema: z.object({
      query: z.string().describe('Gmail search query string'),
      maxResults: z
        .number()
        .int()
        .min(1)
        .max(20)
        .optional()
        .default(5)
        .describe('Number of messages to return (1-20, default 5)'),
    }),
    execute: async ({ query, maxResults = 5 }) => {
      const token = await getAccessToken();
      const gmail = gmailClient(token);

      const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
      const msgs = list.data.messages;
      if (!msgs?.length) return 'No emails found for that query.';

      const summaries = await Promise.all(
        msgs.map(async ({ id }) => {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: id!,
            format: 'metadata',
            metadataHeaders: ['From', 'Subject', 'Date'],
          });
          const headers = msg.data.payload?.headers ?? [];
          const h = (name: string) => headers.find((x) => x.name === name)?.value ?? '(none)';
          return `From: ${h('From')}\nSubject: ${h('Subject')}\nDate: ${h('Date')}`;
        }),
      );

      return summaries.join('\n\n---\n\n');
    },
  }),
);

export const gmailComposeTool = withGmailWrite(
  tool({
    description: "Send an email on the user's behalf via Gmail.",
    inputSchema: z.object({
      to: z.array(z.string().email()).describe('Recipient email addresses'),
      subject: z.string().describe('Email subject line'),
      message: z.string().describe('Plain-text email body'),
      cc: z.array(z.string().email()).optional().describe('CC addresses (optional)'),
    }),
    execute: async ({ to, subject, message, cc }) => {
      const token = await getAccessToken();
      const gmail = gmailClient(token);

      const lines = [
        `To: ${to.join(', ')}`,
        ...(cc?.length ? [`Cc: ${cc.join(', ')}`] : []),
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        message,
      ];
      const raw = Buffer.from(lines.join('\r\n')).toString('base64url');

      await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
      return `Email sent to ${to.join(', ')}.`;
    },
  }),
);
