# Oktane Lab: Secure Your AI Agents with Auth0 for AI Agents

In this lab you will work with **Z-Assistant**, an AI-powered customer service agent for **RetailZero** — a fictitious e-commerce platform. You will progressively secure Z-Assistant using **Auth0 for AI Agents**, learning how to prevent an AI agent from autonomously executing sensitive operations like financial refunds or exposing private customer data.

By the end of the lab you will have implemented **Client-Initiated Backchannel Authentication (CIBA)** — a human-in-the-loop authorization pattern that requires the logged-in user to approve sensitive actions on their mobile device before the agent can proceed.

---
# How to Get Started with this Lab

### This lab requires an OpenAI API key: **⚠️ You will need to set up billing to make calls using this API key.** You will be walked through how to set this up in the lab.

## Create Required Free Accounts

1. A GitHub account with Codespaces access (you can use the free plan, which gives you 60 hours of use per month). Create a free account [here](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account) if you do not already have one.

    **⚠️ Note to internal Okta employees: Do NOT use your EMU (Enterprise-managed user) account since Codespaces are disabled.**

2. An Auth0 account: You'll also need an Auth0 account. If you do not already have one, you can create a free one [here](https://auth0.com/signup).

3. The **Auth0 Guardian** app on your smartphone ([iOS](https://apps.apple.com/us/app/auth0-guardian/id1093100804) / [Android](https://play.google.com/store/apps/details?id=com.auth0.guardian)) — required for the CIBA push notification flow in Tour 5.

## Accessing and Working with Auth0 Labs

1. **After logging into GitHub, open the lab repo in a Codespace:** From the *Code* dropdown menu of this branch, toggle to the *Codespaces* tab. Select the plus sign to create and open the lab in a Codespace. A new tab will open, and Codespaces will begin configuring the lab environment. Wait for the environment to finish building.
2. **Begin working with the lab:** Once the environment loads all the required libraries and extensions, you'll see a Codetour popup with instructions on how to get started. At this point, you should follow the remainder of the instructions within Codetour!

### Notes:
- **If you'd like to save your work to your own fork:** You can commit and push your changes to a fork of this repo. (See: [Using Source Control in Your Codespace](https://docs.github.com/en/codespaces/developing-in-codespaces/using-source-control-in-your-codespace)).
- **Close the Codespace when you're finished with the lab:** Codespaces come with a set amount of free usage. To avoid using all of your free use allocation, be sure to return to the forked repo, select the "Code" dropdown, select the dots next to your open Codespace, and select "Delete." This will not delete your forked repository. You can keep that forever, and open a new Codespace whenever you like.
- Questions? Check out our [Lab FAQs](https://auth0-training.github.io/)!


### Issue Reporting
---
If you have found a bug or if you have a feature request, please report them at this repository issues section. Please do not report security vulnerabilities on the public GitHub issue tracker. The [Responsible Disclosure Program](https://auth0.com/whitehat) details the procedure for disclosing security issues.

### Author
---

[Auth0](https://auth0.com)

### License
---

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
