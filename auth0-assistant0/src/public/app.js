// Stable session ID for Token Vault credential caching within a conversation
const sessionId = crypto.randomUUID();

// Conversation history sent with every request for multi-turn context
let messages = [];
let busy = false;

const inputEl   = document.getElementById('msg-input');
const sendBtn   = document.getElementById('send-btn');
const msgsEl    = document.getElementById('messages');
const statusEl  = document.getElementById('status');
const banner    = document.getElementById('auth-banner');
const connectBtn= document.getElementById('connect-btn');
const authBtn   = document.getElementById('auth-btn');
const userNameEl= document.getElementById('user-name');

// ── Auth ──────────────────────────────────────────────────────────────────────

async function loadSession() {
  const res = await fetch('/api/session');
  const session = await res.json();

  if (session?.user) {
    const name = session.user.name || session.user.email || 'User';
    userNameEl.textContent = name;
    authBtn.textContent = 'Log Out';
    authBtn.className = 'btn btn-logout';
    authBtn.onclick = () => { window.location.href = '/auth/logout'; };
    setInputEnabled(true);
  } else {
    userNameEl.textContent = '';
    authBtn.textContent = 'Log In';
    authBtn.className = 'btn btn-login';
    authBtn.onclick = () => { window.location.href = '/auth/login'; };
    setInputEnabled(false);
  }
}

function setInputEnabled(enabled) {
  inputEl.disabled = !enabled;
  sendBtn.disabled = !enabled || busy;
}

// ── Message rendering ─────────────────────────────────────────────────────────

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
  return div;
}

// ── Token Vault redirect ──────────────────────────────────────────────────────

function showAuthBanner(connection, scopes, authorizationParams) {
  const params = new URLSearchParams({ connection, returnTo: '/' });
  (scopes || []).forEach(s => params.append('scopes', s));
  Object.entries(authorizationParams || {}).forEach(([k, v]) => params.set(k, v));
  connectBtn.onclick = () => { window.location.href = `/auth/connect?${params}`; };
  banner.classList.add('visible');
}

// ── Send a message ────────────────────────────────────────────────────────────

async function send() {
  const text = inputEl.value.trim();
  if (!text || busy) return;

  banner.classList.remove('visible');
  inputEl.value = '';
  messages.push({ role: 'user', content: text });
  addMessage('user', text);

  const assistantDiv = addMessage('assistant', '');
  let assistantText = '';

  busy = true;
  sendBtn.disabled = true;
  setStatus('Thinking…');

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, sessionId }),
    });

    if (!response.ok) {
      assistantDiv.textContent = `Request failed (${response.status}).`;
      return;
    }

    // Parse the SSE-style stream emitted by the server
    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith('data: ') && currentEvent) {
          let data;
          try { data = JSON.parse(line.slice(6)); } catch { break; }

          switch (currentEvent) {
            case 'text':
              assistantText += data.delta ?? '';
              assistantDiv.textContent = assistantText;
              msgsEl.scrollTop = msgsEl.scrollHeight;
              break;

            case 'tool_call':
              setStatus(`Using ${data.toolName}…`);
              break;

            case 'tool_result':
              setStatus('Thinking…');
              break;

            case 'auth_required':
              // Remove the empty assistant bubble and show the connect banner
              assistantDiv.remove();
              showAuthBanner(data.connection, data.scopes, data.authorizationParams);
              break;

            case 'done':
              setStatus('');
              break;

            case 'error':
              assistantDiv.textContent = `Error: ${data.message}`;
              break;
          }

          currentEvent = null;
        }
      }
    }

    if (assistantText) {
      messages.push({ role: 'assistant', content: assistantText });
    }
  } catch (err) {
    assistantDiv.textContent = 'Connection error — please try again.';
    console.error(err);
  } finally {
    busy = false;
    sendBtn.disabled = false;
    setStatus('');
  }
}

function setStatus(text) {
  statusEl.textContent = text;
}

// ── Event listeners ───────────────────────────────────────────────────────────

sendBtn.addEventListener('click', send);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────

loadSession();
