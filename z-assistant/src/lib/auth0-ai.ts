import { config } from 'dotenv';

// Load env vars at the top of the module body — before new Auth0AI() reads process.env.
// .env.local is created by the devcontainer postCreateCommand and filled in by the Auth0
// lab extension. .env is the fallback for plain local development.
config({ path: '.env.local', override: false });
config({ path: '.env', override: false });

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
// registered device. The operation only proceeds when the user approves.
//
// export const withRefundApproval = auth0AI.withAsyncAuthorization({
//   userID: () => getUserID(),
//   bindingMessage: (toolArgs: { orderId: string; amount: number; reason: string }) =>
//     `Approve refund of $${toolArgs.amount.toFixed(2)} for order ${toolArgs.orderId}?`,
//   scopes: ['openid', 'profile'],
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
//     `Allow Z-Assistant to access private profile data for customer ${toolArgs.customerId}?`,
//   scopes: ['openid', 'profile'],
// });
