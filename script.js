const API_URL = "https://vireonix.ai/v1/chat/completions";
const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const promptEl = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const welcome = document.getElementById("welcome");
let history = [];
let busy = false;

function addMessage(role, content, extra = "") {
  const el = document.createElement("div");
  el.className = "message " + role + (extra ? " " + extra : "");
  el.textContent = content;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}
function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  sendBtn.textContent = value ? "…" : "➤";
}
async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || busy) return;
  if (welcome) welcome.remove();
  addMessage("user", clean);
  history.push({ role: "user", content: clean });
  promptEl.value = "";
  promptEl.style.height = "auto";
  setBusy(true);
  const typing = addMessage("typing", "PixAI در حال فکر کردنه…");
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "auto", messages: history })
    });
    const data = await response.json().catch(() => ({}));
    typing.remove();
    if (!response.ok) {
      const detail = data?.error?.message || data?.error?.type || "";
      throw new Error(response.status === 429
        ? "سهمیه ساعتی سرویس فعلاً تمام شده؛ کمی بعد دوباره امتحان کن."
        : "سرویس پاسخ نداد (HTTP " + response.status + "). " + detail);
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("پاسخ سرویس خالی بود.");
    history.push({ role: "assistant", content: answer });
    addMessage("assistant", answer);
  } catch (err) {
    typing.remove();
    const msg = String(err?.message || err);
    const corsHint = /failed to fetch|networkerror|load failed/i.test(msg)
      ? " ممکن است مرورگر اتصال مستقیم را به‌خاطر CORS مسدود کرده باشد؛ در این صورت GitHub Pages به‌تنهایی کافی نیست."
      : "";
    addMessage("assistant", msg + corsHint, "error");
    history.pop();
  } finally {
    setBusy(false);
    promptEl.focus();
  }
}
form.addEventListener("submit", event => {
  event.preventDefault();
  sendMessage(promptEl.value);
});
promptEl.addEventListener("input", () => {
  promptEl.style.height = "auto";
  promptEl.style.height = Math.min(promptEl.scrollHeight, 130) + "px";
});
promptEl.addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => sendMessage(button.textContent));
});
document.getElementById("newChat").addEventListener("click", () => {
  history = [];
  messagesEl.innerHTML = "";
  const panel = document.createElement("div");
  panel.className = "welcome";
  panel.innerHTML = '<div class="welcome-icon">✦</div><h1>گفت‌وگوی تازه</h1><p>سؤالت رو بنویس تا شروع کنیم.</p>';
  messagesEl.appendChild(panel);
  promptEl.focus();
});
document.getElementById("menuBtn").addEventListener("click", () => {
  document.querySelector(".sidebar").classList.toggle("open");
});
