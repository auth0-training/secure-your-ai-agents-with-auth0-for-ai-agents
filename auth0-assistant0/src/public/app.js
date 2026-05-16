// Stable session ID for Token Vault credential caching within a conversation.
// Must survive the auth popup flow — never regenerated on the same page load.
const sessionId = crypto.randomUUID();

let messages = [];
let busy = false;
let pendingRetry = null; // user message to replay after popup auth completes

const inputEl   = document.getElementById('msg-input');
const sendBtn   = document.getElementById('send-btn');
const msgsEl    = document.getElementById('messages');
const statusEl  = document.getElementById('status');
const inputRow  = document.getElementById('input-row');
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
    inputRow.style.display = '';
    setInputEnabled(true);
  } else {
    userNameEl.textContent = '';
    authBtn.textContent = 'Log In';
    authBtn.className = 'btn btn-login';
    authBtn.onclick = () => { window.location.href = '/auth/login'; };
    inputRow.style.display = 'none';
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

// ── Token Vault popup auth ────────────────────────────────────────────────────

// Opens a popup instead of redirecting the whole page.
// The popup hits /close which postMessages 'auth_complete' back here, then closes.
function showAuthBanner(connection, scopes, authorizationParams) {
  const params = new URLSearchParams({ connection, returnTo: '/close' });
  (scopes || []).forEach(s => params.append('scopes', s));
  Object.entries(authorizationParams || {}).forEach(([k, v]) => params.set(k, v));

  connectBtn.onclick = () => {
    window.open(
      `/auth/connect?${params}`,
      'auth_popup',
      'width=600,height=700,popup=yes',
    );
  };

  banner.classList.add('visible');
}

// When the popup completes auth it sends this message, then closes itself.
window.addEventListener('message', (e) => {
  if (e.origin !== window.location.origin || e.data !== 'auth_complete') return;
  banner.classList.remove('visible');
  if (pendingRetry) {
    const msg = pendingRetry;
    pendingRetry = null;
    sendMessage(msg);
  }
});

// ── Core send logic ───────────────────────────────────────────────────────────

// Sends `text` as a user turn. Called directly for retries; called via send() for
// new user input so the textarea can be cleared first.
async function sendMessage(text) {
  if (!text || busy) return;

  banner.classList.remove('visible');
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
              // Remove the failed user turn from history so the retry sends it cleanly.
              pendingRetry = messages[messages.length - 1]?.content ?? null;
              messages.pop();
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

async function send() {
  const text = inputEl.value.trim();
  if (!text || busy) return;
  inputEl.value = '';
  pendingRetry = null; // discard stale retry if user sends a fresh message
  await sendMessage(text);
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
