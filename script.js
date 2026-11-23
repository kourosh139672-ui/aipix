const DEFAULT_API_URL = "";
function getApiConfig() {
  let url = sessionStorage.getItem("pixai_api_url") || "";
  let token = sessionStorage.getItem("pixai_api_token") || "";
  if (!url) {
    url = (window.prompt("آدرس API را از خروجی دفترچه Colab کپی کن:") || "").trim();
    if (!url) return null;
    token = (window.prompt("کلید دسترسی PixAI را از خروجی Colab وارد کن:") || "").trim();
    if (!token) return null;
    sessionStorage.setItem("pixai_api_url", url.replace(/\\/$/, ""));
    sessionStorage.setItem("pixai_api_token", token);
  }
  return { url: url.replace(/\\/$/, ""), token };
}
const SYSTEM_PROMPT = `تو PixAI هستی، دستیار هوش مصنوعی فارسی‌زبان پروژه AIPix.
- به زبان کاربر پاسخ بده؛ فارسی را روان، خودمانی و روشن بنویس.
- پاسخ را متناسب با سؤال، دقیق و تا حد لازم کوتاه نگه دار.
- اگر کاربر پرسید کی هستی، بگو دستیار هوش مصنوعی پروژه AIPix هستی.
- اگر درباره مدل پایه یا سازنده‌ات پرسیدند، چیزی را جعل نکن؛ فقط اطلاعاتی را بگو که واقعاً در اختیارت است.
- اگر پاسخ را نمی‌دانی، صادقانه بگو و حدس را به‌عنوان واقعیت ارائه نکن.
- ادعا نکن به اینترنت، فایل‌ها، ابزارها یا سرویس ساخت تصویر وصل هستی مگر واقعاً از طریق ابزار فعال به آن دسترسی داشته باشی.
- اگر کاربر ساخت تصویر خواست و ابزار تصویر فعال نیست، شفاف بگو که در این نسخه ابزار تصویر متصل نیست.
- رمز، کد ورود یا اطلاعات محرمانه درخواست نکن.
- در موضوعات پزشکی، ایمنی و موضوعات حساس با احتیاط پاسخ بده؛ برای خطر فوری، کمک گرفتن از یک بزرگسال قابل اعتماد یا خدمات اضطراری را توصیه کن.
- محترمانه، صبور و مفید باش؛ توهین و تحقیر نکن.`;

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
  const config = getApiConfig();
  if (!config) {
    addMessage("assistant", "اتصال PixAI تنظیم نشد. ابتدا دفترچه API را در Colab اجرا کن و آدرس و کلید را وارد کن.", "error");
    return;
  }
  if (welcome?.isConnected) welcome.remove();
  addMessage("user", clean);
  history.push({ role: "user", content: clean });
  promptEl.value = "";
  promptEl.style.height = "auto";
  setBusy(true);
  const typing = addMessage("typing", "PixAI در حال فکر کردنه…");
  try {
    const response = await fetch(config.url.endsWith("/v1/chat/completions") ? config.url : config.url + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.token },
      body: JSON.stringify({
        model: "auto",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history]
      })
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
  if (busy) return;
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
