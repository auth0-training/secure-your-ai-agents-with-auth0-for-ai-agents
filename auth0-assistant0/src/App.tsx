import { useEffect, useState } from 'react';
import { Github, LogIn, UserPlus } from 'lucide-react';
import { NuqsAdapter } from 'nuqs/adapters/react';

import { ActiveLink } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import UserButton from '@/components/auth0/user-button';
import { ChatWindow } from '@/components/chat-window';
import { GuideInfoBox } from '@/components/guide/GuideInfoBox';

interface User {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/session')
      .then(r => r.json())
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  const InfoCard = (
    <GuideInfoBox>
      <ul>
        <li className="text-l">
          🤝
          <span className="ml-2">
            This template showcases a simple chatbot using Vercel&apos;s{' '}
            <a className="text-blue-500" href="https://sdk.vercel.ai/docs" target="_blank" rel="noreferrer">
              AI SDK
            </a>.
          </span>
        </li>
        <li className="hidden text-l md:block">
          💻
          <span className="ml-2">
            You can find the prompt and model logic in <code>app/api/chat/route.ts</code>.
          </span>
        </li>
        <li className="hidden text-l md:block">
          🎨
          <span className="ml-2">
            The main frontend logic is found in <code>src/App.tsx</code>.
          </span>
        </li>
        <li className="text-l">
          👇
          <span className="ml-2">
            Try asking e.g. <code>What can you help me with?</code> below!
          </span>
        </li>
      </ul>
    </GuideInfoBox>
  );

  return (
    <NuqsAdapter>
      <div className="bg-secondary grid grid-rows-[auto,1fr] h-[100dvh]">
        <div className="grid grid-cols-[1fr,auto] gap-2 p-4 bg-black/25">
          <div className="flex gap-4 flex-col md:flex-row md:items-center">
            <a href="https://a0.to/ai-event" rel="noopener noreferrer" target="_blank" className="flex items-center gap-2 px-4">
              <img src="/images/auth0-logo.svg" alt="Auth0 AI Logo" className="h-8" />
            </a>
            <span className="font-mono text-white text-2xl">Assistant0</span>
            <nav className="flex gap-1 flex-col md:flex-row">
              <ActiveLink href="/">Chat</ActiveLink>
            </nav>
          </div>
          <div className="flex justify-center">
            {user && (
              <div className="flex items-center gap-2 px-4 text-white">
                <UserButton user={user} logoutUrl="/auth/logout" />
              </div>
            )}
            <Button asChild variant="header" size="default">
              <a href="https://github.com/oktadev/auth0-assistant0" target="_blank" rel="noreferrer">
                <Github className="size-3" />
                <span>Open in GitHub</span>
              </a>
            </Button>
          </div>
        </div>
        <div className="gradient-up bg-gradient-to-b from-white/10 to-white/0 relative grid border-input border-b-0">
          <div className="absolute inset-0">
            {!user ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] my-auto gap-4">
                <h2 className="text-xl">You are not logged in</h2>
                <div className="flex gap-4">
                  <Button asChild variant="default" size="default">
                    <a href="/auth/login" className="flex items-center gap-2">
                      <LogIn />
                      <span>Login</span>
                    </a>
                  </Button>
                  <Button asChild variant="default" size="default">
                    <a href="/auth/login?screen_hint=signup">
                      <UserPlus />
                      <span>Sign up</span>
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <ChatWindow
                endpoint="api/chat"
                emoji="🤖"
                placeholder={`Hello ${user?.name}, I'm your personal assistant. How can I help you today?`}
                emptyStateComponent={InfoCard}
              />
            )}
          </div>
        </div>
      </div>
      <Toaster richColors />
    </NuqsAdapter>
  );
}
