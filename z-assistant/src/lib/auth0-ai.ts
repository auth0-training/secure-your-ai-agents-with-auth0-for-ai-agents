import { config } from 'dotenv';
import { AsyncLocalStorage } from 'node:async_hooks';

// Load env vars at the top of the module body — before new Auth0AI() reads process.env.
// .env.local is created by the devcontainer postCreateCommand and filled in by the Auth0
// lab extension. .env is the fallback for plain local development.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

// sseStore makes the Express SSE send() function accessible inside CIBA callbacks.
// onAuthorizationRequest runs deep inside the Vercel AI SDK tool-execution pipeline
// and has no direct reference to the HTTP response. AsyncLocalStorage threads send()
// through the async call chain so the callback can notify the browser without any
// additional parameters.
export type SendFn = (event: string, data: unknown) => void;
export const sseStore = new AsyncLocalStorage<SendFn>();

// TODO (Tour 05 - Step 1): Import Auth0AI and getUserID
//
// import { Auth0AI } from '@auth0/ai-vercel';
// import { getUserID } from './auth0.js';

// TODO (Tour 05 - Step 2): Initialize the Auth0AI client
//
// const auth0AI = new Auth0AI();

// TODO (Tour 05 - Step 3): Export withRefundApproval
//
// This CIBA wrapper intercepts the processRefund tool. Before the tool executes,
// Auth0 sends an out-of-band approval notification to the logged-in user's
// registered device. The wrapper uses polling mode (onAuthorizationRequest) so the
// SSE connection stays open while waiting — the refund completes automatically
// once the user approves, with no Retry button needed.
//
// export const withRefundApproval = auth0AI.withAsyncAuthorization({
//   userID: () => getUserID(),
//   bindingMessage: (toolArgs: { orderId: string; amount: number; reason: string }) =>
//     `Approve refund of ${toolArgs.amount.toFixed(2)} USD for order ${toolArgs.orderId}`,
//   scopes: ['openid', 'profile'],
//   onAuthorizationRequest: async (_authReq: any, creds: Promise<any>) => {
//     sseStore.getStore()?.('ciba_pending', { message: 'An approval request has been sent to your device. Approve it to process the refund.' });
//     await creds;
//   },
//   onUnauthorized: (err: unknown) => { throw err; },
// });

// TODO (Tour 05 - Step 4): Export withCustomerDataApproval
//
// This CIBA wrapper intercepts the getCustomerProfile tool. Accessing a customer's
// private profile (phone, address, payment methods) requires explicit approval,
// preventing the AI agent from autonomously exposing sensitive PII.
//
// export const withCustomerDataApproval = auth0AI.withAsyncAuthorization({
//   userID: () => getUserID(),
//   bindingMessage: (toolArgs: { customerId: string }) =>
//     `Allow Z-Assistant to access private profile data for customer ${toolArgs.customerId}`,
//   scopes: ['openid', 'profile'],
//   onAuthorizationRequest: async (_authReq: any, creds: Promise<any>) => {
//     sseStore.getStore()?.('ciba_pending', { message: 'An approval request has been sent to your device. Approve it to access the customer profile.' });
//     await creds;
//   },
//   onUnauthorized: (err: unknown) => { throw err; },
// });
