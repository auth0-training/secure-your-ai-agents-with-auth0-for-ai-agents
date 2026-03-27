import { tool } from 'ai';
import { z } from 'zod';
import { GmailCreateDraft, GmailSearch } from '@langchain/community/tools/gmail';

import { getAccessToken, withGmailRead, withGmailWrite } from '../auth0-ai';

// Provide the access token to the Gmail tools
const gmailParams = {
  credentials: {
    // Get the access token from Auth0 AI
    accessToken: getAccessToken,
  },
};

const gmailSearch = new GmailSearch(gmailParams);

export const gmailSearchTool = withGmailRead(
  tool({
    description: 'Search for emails in the user\'s Gmail inbox. Use this tool to find emails based on queries like sender, subject, or content. You can search for recent emails or specific threads.',
    inputSchema: z.object({
      query: z.string(),
      maxResults: z.number().optional(),
      resource: z.enum(['messages', 'threads']).optional(),
    }),
    execute: async (args) => {
      console.log('🔍 Gmail Search Tool called with args:', args);
      try {
        const result = await gmailSearch._call(args);
        console.log('🔍 Gmail Search Tool result:', result);
        return result;
      } catch (error) {
        console.error('🔍 Gmail Search Tool error:', error);
        throw error;
      }
    },
  }),
);

const gmailDraft = new GmailCreateDraft(gmailParams);

export const gmailDraftTool = withGmailWrite(
  tool({
    description: 'Create and send email drafts in Gmail. Use this tool to compose new emails with subject, message body, and recipients.',
    inputSchema: z.object({
      message: z.string(),
      to: z.array(z.string()),
      subject: z.string(),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
    }),
    execute: async (args) => {
      console.log('📧 Gmail Draft Tool called with args:', args);
      try {
        const result = await gmailDraft._call(args);
        console.log('📧 Gmail Draft Tool result:', result);
        return result;
      } catch (error) {
        console.error('📧 Gmail Draft Tool error:', error);
        throw error;
      }
    },
  }),
);
