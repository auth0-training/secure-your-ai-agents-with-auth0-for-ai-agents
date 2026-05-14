# Lab: Secure Your AI Agents to Act on the Behalf of Users


As part of Auth0 for AI Agents, you can securely manage users and control the actions your AI agent takes when calling external tools and APIs. This lab is adapted from the Oktane 2025 lab built by [@jtemporal](https://github.com/jtemporal/authing-your-genai) and uses a modified version of the Assistant0 AI agent app built by [@deepu105](https://github.com/auth0-samples/auth0-assistant0). We will add Gmail tooling to this application and integrate the application with Auth0 Token Vault so that the agent can read and compose emails on your behalf.

---
# How to Get Started with this Lab

### This lab requires an OpenAI API key: **⚠️ You will need to set up billing to make calls using this API key.** You will be walked through how to set this up in the lab.

## Create Required Free Accounts

1. A GitHub account with Codespaces access (you can use the free plan, which gives you 60 hours of use per month). Create a free account [here](https://docs.github.com/en/get-started/signing-up-for-github/signing-up-for-a-new-github-account) if you do not already have one.

    **⚠️ Note to internal Okta employees: Do NOT use your EMU (Enterprise-managed user) account since Codespaces are disabled.**

2. An Auth0 account: You'll also need an Auth0 account. If you do not already have one, you can create a free one [here](https://auth0.com/signup).

3. A Google Cloud Developer account: You can use a free account. We will walk through how to set this up in the lab.

## Accessing and Working with Auth0 Labs

1. **After logging into GitHub, open the lab repo in a Codespace:** From the *Code* dropdown menu of this branch, toggle to the *Codespaces* tab. Click the plus sign to create and open the lab in a Codespace. A new tab will open, and Codespaces will begin configuring the lab environment. Wait for the environment to finish building.
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
