const DEFAULT_API_URL = "https://aipix-api.kourosh-1396-72.workers.dev";
function getApiConfig() {
  const url = (sessionStorage.getItem("pixai_api_url") || DEFAULT_API_URL).replace(/\/$/, "");
  let token = sessionStorage.getItem("pixai_api_token") || "";
  if (!token) {
    token = (window.prompt("توکن خصوصی AIPix را وارد کن:") || "").trim();
    if (!token) return null;
    sessionStorage.setItem("pixai_api_token", token);
  }
  return { url, token };
}
const SYSTEM_PROMPT = `تو PixAI هستی، دستیار هوش مصنوعی فارسی‌زبان پروژه AIPix.
- به زبان کاربر پاسخ بده؛ فارسی را روان، خودمانی و روشن بنویس.
- پاسخ را متناسب با سؤال، دقیق و تا حد لازم کوتاه نگه دار.
- اگر کاربر درخواست ساخت، کشیدن یا تولید تصویر کرد، از ابزار generate_image استفاده کن. توضیح تصویر را دقیق و کامل به prompt ابزار تبدیل کن.
- فقط وقتی ابزار تصویر با موفقیت اجرا شد بگو تصویر ساخته شده است. اگر ابزار خطا داد، صادقانه خطا را توضیح بده.
- برای سؤال‌های عادی، گفتگو و پاسخ متنی داشته باش و بی‌دلیل ابزار تصویر را اجرا نکن.
- از قابلیت‌هایی که ابزارشان در دسترس نیست ادعای استفاده نکن.
- اگر درباره مدل پایه یا سازنده‌ات پرسیدند، چیزی را جعل نکن؛ فقط اطلاعاتی را بگو که واقعاً در اختیارت است.
- اگر پاسخ را نمی‌دانی، صادقانه بگو و حدس را به‌عنوان واقعیت ارائه نکن.
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

function addMessage(role, content, extra = "", imageData = null) {
  const el = document.createElement("div");
  el.className = "message " + role + (extra ? " " + extra : "");
  el.textContent = content;
  if (imageData) {
    const image = document.createElement("img");
    image.className = "generated-image";
    image.alt = "تصویر ساخته‌شده توسط PixAI";
    image.src = imageData.startsWith("data:image/")
      ? imageData
      : "data:image/png;base64," + imageData;
    image.loading = "lazy";
    el.appendChild(document.createElement("br"));
    el.appendChild(image);
  }
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
    addMessage("assistant", "اتصال PixAI تنظیم نشد. توکن خصوصی را وارد کن تا ارتباط برقرار شود.", "error");
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
    const response = await fetch(config.url + "/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.token },
      body: JSON.stringify({
        model: "auto",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        max_tokens: 768
      })
    });
    const data = await response.json().catch(() => ({}));
    typing.remove();
    if (!response.ok) {
      const detail = data?.detail || data?.error?.message || data?.error || "";
      throw new Error(response.status === 401
        ? "توکن اتصال درست نیست. صفحه را تازه کن و توکن را دوباره وارد کن."
        : response.status === 429
          ? "سهمیه سرویس فعلاً تمام شده؛ بعداً دوباره امتحان کن."
          : "سرویس پاسخ نداد (HTTP " + response.status + "). " + detail);
    }
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) throw new Error("پاسخ سرویس خالی بود.");
    history.push({ role: "assistant", content: answer });
    const imageData = data?.images?.[0]?.b64_json || null;
    addMessage("assistant", answer, "", imageData);
  } catch (err) {
    typing.remove();
    const msg = String(err?.message || err);
    const corsHint = /failed to fetch|networkerror|load failed/i.test(msg)
      ? " اتصال شبکه یا تنظیمات CORS را بررسی کن."
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
