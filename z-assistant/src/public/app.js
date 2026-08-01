// Stable session ID — doubles as the CIBA threadID for credential caching.
// Must persist within a page load so retries after CIBA approval reuse the same thread.
const sessionId = crypto.randomUUID();

let messages = [];
let busy = false;
// pendingRetry is unused in polling mode but kept here in case interrupt mode is re-enabled.

const inputEl   = document.getElementById('msg-input');
const sendBtn   = document.getElementById('send-btn');
const msgsEl    = document.getElementById('messages');
const statusEl  = document.getElementById('status');
const inputRow  = document.getElementById('input-row');
const banner    = document.getElementById('auth-banner');
const retryBtn  = document.getElementById('retry-btn');
const authBtn   = document.getElementById('auth-btn');
const userNameEl= document.getElementById('user-name');
const cibaMsg   = document.getElementById('ciba-message');

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

// ── CIBA approval banner ──────────────────────────────────────────────────────

// Shows a banner telling the user to check their device for a CIBA approval request.
// The Retry button re-sends the same message once the user has approved.
function showCIBABanner(message) {
  cibaMsg.textContent = message ??
    'Check your Auth0 Guardian app for an approval request. Once approved, select Retry.';
  banner.classList.add('visible');
}

// retryBtn is unused in polling mode (approval completes the tool call automatically).
retryBtn.addEventListener('click', () => banner.classList.remove('visible'));

// ── Core send logic ───────────────────────────────────────────────────────────

// Sends `text` as a user turn. Called directly for CIBA retries; called via send()
// for new user input after clearing the textarea.
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

            case 'ciba_pending':
              // Approval request sent — keep the connection open and show status.
              // The tool will complete automatically once the user approves on their device.
              setStatus(data.message ?? 'Waiting for approval on your device…');
              break;

            case 'ciba_denied':
              assistantDiv.textContent = data.message ?? 'Authorization denied.';
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
  pendingRetry = null; // discard stale retry when user sends a fresh message
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
