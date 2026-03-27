#!/usr/bin/env bash

if [ -n "$CODESPACE_NAME" ]; then
  export DOMAIN="https://${CODESPACE_NAME}-3000.app.github.dev"
else
  export DOMAIN="http://localhost:3000"
fi

set -e

clear
echo -e "👋 \033[1mDev\033[0m, let's update the WebApp to use GitHub Codespaces for development!\n\n"
read -p "✅ Press ENTER when you are ready..."
clear

echo -e "Login to the \033[1mAuth0 Dashboard\033[0m:\n"
echo -e "  • Go to: \033[4mhttps://manage.auth0.com\033[0m"
echo -e "  • Log in to your Auth0 account."
echo -e "     • Use the 'genai' tenant"
echo -e "  • In the left menu go to \033[1mApplications\033[0m → \033[1mApplications\033[0m"
echo -e "     • Select the \033[1mWebApp Quickstart Client\033[0m from the list\n"
read -p "✅ Press ENTER once you have the Settings tab for the WebApp Quickstart Client application..."

echo -e "\n\033[2m_______________________________________________________________\033[0m\n\n"
echo -e "\033[1mAdd the Codespaces URLs\033[0m in the Web App Auth0 Settings: \n"
echo -e "  • In the Application Settings tab, in \033[1mApplication URIs\033[0m section, add the URIs below to the pre-set URIs:\n"
echo -e "    \033[1mAllowed Callback URLs\033[0m:  \033[4m$DOMAIN/auth/callback\033[0m"
echo -e "    \033[1mAllowed Logout URLs\033[0m:    \033[4m$DOMAIN\033[0m\n"
echo -e "  • Click \033[1mSave Changes\033[0m at the bottom of the page\n"
echo -e "✅ Press ENTER once you are done..."
read

echo -e "\n\033[2m_______________________________________________________________\033[0m\n\n"
echo -e "🎉 WebApp updates completed.\n"

exit 0