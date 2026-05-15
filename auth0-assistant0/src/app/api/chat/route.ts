import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  UIMessage,
} from 'ai';

import { openai } from '@ai-sdk/openai';
import { setAIContext } from '@auth0/ai-vercel';
import { errorSerializer, withInterruptions } from '@auth0/ai-vercel/interrupts';
// import Gmail tools

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0 with access to Gmail. You can search emails using the gmailSearchTool and compose emails using the gmailDraftTool. When users ask about emails, always use these tools. For example, if they ask to search emails, use gmailSearchTool with appropriate query parameters. If they want to send an email, use gmailDraftTool with the message details. You have full access to Gmail functionality. The current date and time is ${date}`;

/**
 * This handler initializes and calls an tool calling agent.
 */
export async function POST(req: Request) {
  const { id, messages }: { id: string; messages: Array<UIMessage> } = await req.json();

  console.log('💬 Chat request received:', { id, messageCount: messages.length });

  setAIContext({ threadID: id });

  // Add Gmail tools to the agent's toolset
  const tools = {};

  console.log('🛠️ Tools available:', Object.keys(tools));

  const modelMessages = await convertToModelMessages(messages);


  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: withInterruptions(
      async ({ writer }) => {
        const result = streamText({
          model: openai('gpt-4o'),
          system: AGENT_SYSTEM_TEMPLATE,
          messages: modelMessages,
          tools,
          experimental_transform: ({ tools: _tools }) => new TransformStream({
            transform(chunk, controller) {
              if (chunk.type === 'tool-error') {
                const tokenError = chunk.error as any;
                if (tokenError && tokenError.code === 'TOKEN_VAULT_ERROR') {
                  console.log('🔐 Token vault error detected in stream, serializing interrupt');
                  // errorSerializer checks error.cause instanceof Auth0Interrupt and reads
                  // error.toolCallId, error.toolArgs (not .input), and error.toolName
                  const wrapperError: any = new Error(tokenError.message);
                  wrapperError.cause = tokenError;
                  wrapperError.toolCallId = chunk.toolCallId;
                  wrapperError.toolArgs = chunk.input;
                  wrapperError.toolName = chunk.toolName;
                  throw wrapperError;
                }
              }
              controller.enqueue(chunk);
            },
          }),

          onFinish: (output) => {
            console.log('🤖 AI response finished with reason:', output.finishReason);
            if (output.finishReason === 'tool-calls') {
              console.log('🔧 Tool calls detected:', {
                toolCalls: output.toolCalls,
                toolResults: output.toolResults,
              });
            }
          },
        });
        writer.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          }),
        );
      },
      {
        messages: messages,
        tools,
      },
    ),
    onError: errorSerializer((error) => {
      console.error('ai-sdk route: stream error', error);
      return 'Oops, an error occured!';
    }),
  });

  return createUIMessageStreamResponse({ stream });
}
