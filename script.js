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
let codeMode = false;
let videoMode = false;
const videoModeButton = document.getElementById('videoMode');
const codeModeButton = document.getElementById("codeMode");
function updateCodeMode() {
  if (!codeModeButton) return;
  codeModeButton.textContent = codeMode ? "⌘ حالت برنامه‌نویسی: روشن" : "⌘ حالت برنامه‌نویسی: خاموش";
  codeModeButton.classList.toggle("active", codeMode);
  const heading = document.querySelector(".topbar strong");
  if (heading) heading.textContent = videoMode ? "PixAI VideoEngine 2D" : codeMode ? "PixAI Code" : "گفت‌وگوی جدید";
}


function renderProjectFiles(messageEl, content) {
  const pattern = /###\s*FILE:\s*([^\n]+)\n\s*```[^\n]*\n([\s\S]*?)\n```/g;
  const found = [...content.matchAll(pattern)];
  if (!found.length) return;
  const panel = document.createElement("div");
  panel.className = "project-files";
  const title = document.createElement("strong");
  title.textContent = "فایل‌های پروژه";
  panel.appendChild(title);
  found.forEach((match, index) => {
    const path = match[1].trim().replace(/^\/+/, "").replace(/\.\./g, "").replace(/[^a-zA-Z0-9_.\/-]/g, "_");
    if (!path || path.endsWith("/")) return;
    const url = URL.createObjectURL(new Blob([match[2]], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = path.split("/").pop() || ("project-file-" + (index + 1) + ".txt");
    link.textContent = "⬇ " + path;
    link.addEventListener("click", () => setTimeout(() => URL.revokeObjectURL(url), 60000), { once: true });
    panel.appendChild(link);
  });
  if (panel.children.length > 1) messageEl.appendChild(panel);
}
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
  if (role === "assistant" && codeMode) renderProjectFiles(el, content);
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}
function setBusy(value) {
  busy = value;
  sendBtn.disabled = value;
  sendBtn.textContent = value ? "…" : "➤";
}


async function generateVideo(prompt) {
  if (busy) return;
  const config = getApiConfig();
  if (!config) return;
  const imageUri = (document.getElementById("videoImageUrl")?.value || "").trim();
  if (imageUri && !imageUri.startsWith("https://")) { addMessage("assistant", "لینک تصویر باید HTTPS باشد.", "error"); return; }
  const style = document.getElementById("videoStyle")?.value || "2d";
  const styleText = style === "anime" ? "2D anime animation. " : style === "cartoon" ? "2D cartoon animation. " : "Hand-drawn 2D animation. ";
  addMessage("user", prompt);
  setBusy(true);
  const status = addMessage("typing", "در حال ساخت ویدیو…");
  try {
    const response = await fetch(config.url + "/v1/videos/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.token },
      body: JSON.stringify({ prompt: styleText + "Clean outlines, flat colors, consistent characters, smooth motion. " + prompt, duration: 6, resolution: "1280x720", fps: 24, generate_audio: false, ...(imageUri ? { image_uri: imageUri } : {}) })
    });
    const data = await response.json().catch(() => ({}));
    status.remove();
    if (!response.ok) throw new Error(data.detail || data.error || "خطای سرویس ویدیو: " + response.status);
    const videoUrl = data.data?.[0]?.url || data.video_url;
    if (!videoUrl || !videoUrl.startsWith("https://")) throw new Error("لینک ویدیوی معتبر دریافت نشد.");
    const card = document.createElement("div");
    card.className = "message assistant video-result";
    const title = document.createElement("strong"); title.textContent = "ویدیوی PixAI آماده است";
    const video = document.createElement("video"); video.controls = true; video.playsInline = true; video.src = videoUrl;
    const link = document.createElement("a"); link.href = videoUrl; link.target = "_blank"; link.rel = "noopener"; link.textContent = "باز کردن یا ذخیره ویدیو";
    card.append(title, video, link); messagesEl.appendChild(card); messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) { status.remove(); addMessage("assistant", String(error.message || error), "error"); }
  finally { setBusy(false); promptEl.focus(); }
}

async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || busy) return;
  if (videoMode) { addMessage('assistant', 'VideoEngine 2D هنوز به مدل تولید ویدیو متصل نشده است. این بخش فعلاً رابط اولیه است و تا اتصال سرویس، ویدیو تولید نمی‌کند.', 'error'); return; }
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
    const endpoint = codeMode ? "/v1/code/completions" : "/v1/chat/completions";
    const response = await fetch(config.url + endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + config.token },
      body: JSON.stringify({
        model: "auto",
        messages: codeMode ? history : [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        max_tokens: codeMode ? 2048 : 768
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
    const audioData = data?.audio?.b64_json || null;
    if (audioData) {
      const binary = atob(audioData);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const audioUrl = URL.createObjectURL(new Blob([bytes], { type: data.audio.mime_type || "audio/mpeg" }));
      const card = document.createElement("div"); card.className = "message assistant music-result";
      const title = document.createElement("strong"); title.textContent = "موسیقی PixAI آماده است";
      const player = document.createElement("audio"); player.controls = true; player.src = audioUrl;
      const download = document.createElement("a"); download.href = audioUrl; download.download = "pixai-music.mp3"; download.textContent = "دانلود موسیقی";
      card.append(title, player, download); messagesEl.appendChild(card); messagesEl.scrollTop = messagesEl.scrollHeight;
    }
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

videoModeButton?.addEventListener('click', () => {
  if (busy) return;
  videoMode = !videoMode;
  codeMode = false;
  history = [];
  messagesEl.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'welcome';
  panel.innerHTML = videoMode ? '<div class="welcome-icon">🎬</div><h1>PixAI VideoEngine 2D</h1><p>تبدیل متن یا تصویر به انیمیشن دوبعدی</p><div class="video-controls"><label for="videoStyle">سبک</label><select id="videoStyle"><option value="2d">انیمیشن دوبعدی</option><option value="anime">انیمه دوبعدی</option><option value="cartoon">کارتونی</option></select><label for="videoImageUrl">لینک تصویر (اختیاری)</label><input id="videoImageUrl" type="url" placeholder="https://..."></div><p class="video-status">مدل LTX-2.3 Fast؛ هزینه مصرف Cloudflare اعمال می‌شود.</p>' : '<div class="welcome-icon">✦</div><h1>سلام! من PixAI هستم</h1><p>هر چیزی می‌خوای بپرس؛ از همین‌جا شروع کنیم.</p>';
  messagesEl.appendChild(panel);
  videoModeButton.classList.toggle('active', videoMode);
  codeModeButton?.classList.toggle("active", codeMode);
  promptEl.placeholder = videoMode ? 'صحنه انیمیشن دوبعدی رو توصیف کن...' : 'پیامت رو اینجا بنویس...';
  promptEl.focus();
});


codeModeButton?.addEventListener("click", () => {
  videoMode = false;
  videoModeButton?.classList.remove('active');
  if (busy) return;
  codeMode = !codeMode;
  history = [];
  messagesEl.innerHTML = "";
  const panel = document.createElement("div");
  panel.className = "welcome";
  panel.innerHTML = codeMode
    ? '<div class="welcome-icon">⌘</div><h1>PixAI Code</h1><p>درخواست برنامه‌نویسی، ساخت پروژه یا رفع خطا رو بنویس.</p>'
    : '<div class="welcome-icon">✦</div><h1>سلام! من PixAI هستم</h1><p>هر چیزی می‌خوای بپرس؛ از همین‌جا شروع کنیم.</p>';
  messagesEl.appendChild(panel);
  updateCodeMode();
  promptEl.focus();
});
document.getElementById("newChat").addEventListener("click", () => {
  if (busy) return;
  videoMode = false;
  videoModeButton?.classList.remove("active");
  promptEl.placeholder = "پیامت رو اینجا بنویس...";
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
