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
- قبل از پاسخ، منظور کاربر و پیام‌های قبلی همین گفتگو را در نظر بگیر؛ اطلاعاتی را که قبلاً داده دوباره نپرس.
- اگر درخواست چندبخشی است، آن را به ترتیب انجام بده و نتیجهٔ هر بخش را روشن گزارش کن. اگر یک نکتهٔ ضروری واقعاً نامشخص است، فقط یک سؤال کوتاه بپرس.
- بین پاسخ متنی، جست‌وجوی وب و ابزارهای ساخت رسانه، بر اساس قصد واقعی کاربر تصمیم بگیر؛ ابزار را فقط وقتی اجرا کن که درخواست روشن و مرتبط باشد.
- اگر ابزار لازم در دسترس یا پیکربندی‌شده نیست، صریح بگو و وانمود نکن که کاری انجام شده است.
- اطلاعات، لینک‌ها، قیمت‌ها، قابلیت‌ها و نتایج را جعل نکن. بین دانستهٔ قطعی، حدس و اطلاعات تازه تفاوت بگذار.
- از پاسخ‌های کلیشه‌ای و تکرار سؤال کاربر پرهیز کن؛ مستقیم به اصل درخواست جواب بده.
- اگر کاربر درخواست ساخت، کشیدن یا تولید تصویر کرد، از ابزار generate_image استفاده کن. توضیح تصویر را دقیق و کامل به prompt ابزار تبدیل کن.
- اگر کاربر درباره اخبار، قیمت‌ها، اطلاعات جدید، نسخه‌های تازه، رویدادهای جاری یا اطلاعاتی که ممکن است تغییر کرده باشند پرسید، از ابزار web_search استفاده کن. برای اطلاعات پایدار و سؤال‌های عادی بی‌دلیل جست‌وجو نکن. پاسخ را با ارجاع [1] و [2] به منابع ارائه‌شده بنویس و منبع جعل نکن.
- اگر کاربر صریحاً خواست موسیقی یا آهنگ بسازی، از ابزار generate_music استفاده کن. سبک، حال‌وهوا، سازها و مدت درخواستی را به prompt ابزار تبدیل کن؛ اگر مدت مشخص نکرد، ۳۰ ثانیه بساز. درخواست موسیقی را با پاسخ متنی جایگزین نکن و فقط پس از موفقیت ابزار بگو ساخته شده است.
- فقط وقتی ابزار تصویر با موفقیت اجرا شد بگو تصویر ساخته شده است. اگر ابزار خطا داد، صادقانه خطا را توضیح بده.
- برای سؤال‌های عادی، گفتگو و پاسخ متنی داشته باش و بی‌دلیل ابزار تصویر را اجرا نکن.
- از قابلیت‌هایی که ابزارشان در دسترس نیست ادعای استفاده نکن.
- اگر درباره مدل پایه یا سازنده‌ات پرسیدند، چیزی را جعل نکن؛ فقط اطلاعاتی را بگو که واقعاً در اختیارت است.
- اگر پاسخ را نمی‌دانی، صادقانه بگو و حدس را به‌عنوان واقعیت ارائه نکن.
- اگر کاربر صریحاً خواست موردی را برای آینده به خاطر بسپاری، فقط یک نکتهٔ پایدار و غیرحساس را با ابزار save_memory ذخیره کن؛ هرگز رمز، توکن، کلید API یا اطلاعات حساس را ذخیره نکن. اگر خواست چیزی را فراموش کنی، از forget_memory استفاده کن؛ اگر خواست همهٔ حافظه پاک شود، clear_all را فعال کن. اطلاعات حافظه را فقط وقتی مرتبط است به کار ببر و بی‌دلیل بازگو نکن.\n- رمز، کد ورود یا اطلاعات محرمانه درخواست نکن.
- در موضوعات پزشکی، ایمنی و موضوعات حساس با احتیاط پاسخ بده؛ برای خطر فوری، کمک گرفتن از یک بزرگسال قابل اعتماد یا خدمات اضطراری را توصیه کن.
- محترمانه، صبور و مفید باش؛ توهین و تحقیر نکن.`;

const messagesEl = document.getElementById("messages");
const form = document.getElementById("chatForm");
const promptEl = document.getElementById("prompt");
const sendBtn = document.getElementById("sendBtn");
const welcome = document.getElementById("welcome");
let history = [];

const REASONING_LEVEL_KEY = "pixai_reasoning_level";
const reasoningSelect = document.getElementById("reasoningLevel");
const settingsToggle = document.getElementById("settingsToggle");
const settingsPanel = document.getElementById("settingsPanel");
let reasoningLevel = Math.max(1, Math.min(3, Number(localStorage.getItem(REASONING_LEVEL_KEY) || 1)));
if (reasoningSelect) reasoningSelect.value = String(reasoningLevel);
reasoningSelect?.addEventListener("change", () => {
  reasoningLevel = Math.max(1, Math.min(3, Number(reasoningSelect.value) || 1));
  localStorage.setItem(REASONING_LEVEL_KEY, String(reasoningLevel));
});
settingsToggle?.addEventListener("click", () => {
  if (!settingsPanel) return;
  const open = settingsPanel.hasAttribute("hidden");
  settingsPanel.toggleAttribute("hidden", !open);
  settingsToggle.classList.toggle("active", open);
  settingsToggle.setAttribute("aria-expanded", String(open));
});
const CHAT_ARCHIVE_KEY = "pixai_recent_chats";
const ACTIVE_CHAT_KEY = "pixai_active_chat";
function readChatArchive() {
  try {
    const value = JSON.parse(localStorage.getItem(CHAT_ARCHIVE_KEY) || "[]");
    return Array.isArray(value) ? value.slice(-2) : [];
  } catch { return []; }
}
function persistActiveChat() {
  try { localStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(history.slice(-24))); } catch {}
}
function archiveCurrentChat() {
  if (!history.length) return;
  const archive = readChatArchive();
  archive.push(history.slice(-24).map(m => ({role:m.role, content:String(m.content || "").slice(0,3000)})));
  try {
    localStorage.setItem(CHAT_ARCHIVE_KEY, JSON.stringify(archive.slice(-2)));
    localStorage.removeItem(ACTIVE_CHAT_KEY);
  } catch {}
}
function getRecentChatsForRequest() {
  if (reasoningLevel < 2) return [];
  return readChatArchive().map(chat => Array.isArray(chat) ? chat.slice(-8).map(m => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0,1200)
  })) : []).filter(chat => chat.length);
}

const PIXAI_CLIENT_ID = (() => {
  let id = localStorage.getItem("pixai_client_id");
  if (!id) {
    id = (window.crypto?.randomUUID?.() || ("px" + Date.now().toString(36) + Math.random().toString(36).slice(2)));
    localStorage.setItem("pixai_client_id", id);
  }
  return id;
})();
try {
  const saved = JSON.parse(localStorage.getItem(ACTIVE_CHAT_KEY) || "[]");
  if (Array.isArray(saved)) history = saved.filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string").slice(-24);
  if (history.length) {
    welcome?.remove();
    history.forEach(m => addMessage(m.role, m.content));
  }
} catch {}
let busy = false;
let codeMode = false;
let videoMode = false;
let imageMode = false;
const imageModeButton = document.getElementById('imageMode');
const videoModeButton = document.getElementById('videoMode');
const codeModeButton = document.getElementById("codeMode");
function updateCodeMode() {
  if (!codeModeButton) return;
  codeModeButton.textContent = codeMode ? "⌘ حالت برنامه‌نویسی: روشن" : "⌘ حالت برنامه‌نویسی: خاموش";
  codeModeButton.classList.toggle("active", codeMode);
  const heading = document.querySelector(".topbar strong");
  if (heading) heading.textContent = imageMode ? "PixAI ImageEngine 2D" : videoMode ? "PixAI VideoEngine 2D" : codeMode ? "PixAI Code" : "گفت‌وگوی جدید";
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


async function createMotionVideo(userPrompt){
 if(busy)return;const config=getApiConfig();if(!config)return;addMessage("user",userPrompt);setBusy(true);const status=addMessage("typing","PixAI در حال طراحی صحنه دوبعدی است…");
 const instruction='تو طراح صحنه PixAI Motion Engine هستی. دستور فارسی کاربر را به انیمیشن دوبعدی تبدیل کن. فقط JSON معتبر بده: {"title":"عنوان","background":"#b9e5ff","duration":6,"objects":[{"type":"car|circle|rect|text|tree|cloud|sun|person","x":50,"y":65,"width":18,"height":18,"color":"#ef4444","text":"","motion":"left-right|right-left|bounce|rotate|none","speed":12}]}. مختصات درصدی، حداکثر 12 شیء، مدت 2 تا 15 ثانیه. فقط JSON.';
 try{const r=await fetch(config.url+"/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+config.token},body:JSON.stringify({model:"auto",client_id:PIXAI_CLIENT_ID,reasoning_level:reasoningLevel,messages:[{role:"system",content:instruction},{role:"user",content:userPrompt}],max_tokens:1000})});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.detail||(d.error&&d.error.message)||"خطای سرویس "+r.status);let raw=d.choices&&d.choices[0]&&d.choices[0].message?d.choices[0].message.content:"";raw=raw.trim().replace(/^`{3}(?:json)?\s*/i,"").replace(/\s*`{3}$/,"");let a=raw.indexOf("{"),z=raw.lastIndexOf("}");if(a<0||z<=a)throw Error("مدل JSON معتبر برنگرداند.");let scene=JSON.parse(raw.slice(a,z+1));status.remove();const card=document.createElement("section");card.className="message assistant motion-result";const title=document.createElement("strong");title.textContent="PixAI Motion Engine · "+(scene.title||"انیمیشن دوبعدی");const stage=document.createElement("div");stage.className="motion-stage";const controls=document.createElement("div");controls.className="motion-actions";const p=document.createElement("button"),s=document.createElement("button"),e=document.createElement("button");p.textContent="▶ پیش‌نمایش";s.textContent="■ توقف";e.textContent="⬇ ساخت ویدیو";[p,s,e].forEach(x=>x.type="button");const note=document.createElement("small");note.textContent="رندر محلی · خروجی WebM";controls.append(p,s,e);card.append(title,stage,controls,note);messagesEl.appendChild(card);const engine=window.PixAIMotionEngine.mount(stage,scene);p.onclick=()=>engine.play();s.onclick=()=>engine.stop();e.onclick=async()=>{e.disabled=true;e.textContent="در حال ضبط…";try{let blob=await engine.exportVideo(),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="pixai-motion.webm";a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);e.textContent="ویدیو آماده شد"}catch(err){note.textContent=String(err.message||err);e.textContent="تلاش دوباره"}finally{e.disabled=false}};messagesEl.scrollTop=messagesEl.scrollHeight}catch(err){status.remove();addMessage("assistant",String(err.message||err),"error")}finally{setBusy(false);promptEl.focus()}
}


async function createPixAIImage(userPrompt) {
  if (busy) return;
  const config = getApiConfig();
  if (!config) return;
  addMessage("user", userPrompt);
  setBusy(true);
  const status = addMessage("typing", "PixAI در حال طراحی تصویر دوبعدی است…");
  const instruction = 'تو طراح گرافیک دوبعدی PixAI هستی. درخواست فارسی را به تصویر قابل رسم با Canvas تبدیل کن. فقط JSON معتبر بده: {"title":"عنوان","background":"#hex","objects":[{"type":"rect|circle|ellipse|triangle|star|text|line|sun|cloud|tree|house|mountain|person","x":50,"y":50,"width":20,"height":20,"color":"#hex","stroke":"#hex","text":"متن"}]}. مختصات و اندازه‌ها درصدی از 0 تا 100 هستند. حداکثر 24 شیء. صحنه کامل و منظم طراحی کن. فقط JSON.';
  try {
    const response = await fetch(config.url + "/v1/chat/completions", {
      method: "POST",
      headers: {"Content-Type":"application/json","Authorization":"Bearer " + config.token},
      body: JSON.stringify({model:"auto",client_id:PIXAI_CLIENT_ID,reasoning_level:reasoningLevel,messages:[{role:"system",content:instruction},{role:"user",content:userPrompt}],max_tokens:1400})
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || data.error?.message || "خطای سرویس " + response.status);
    let raw = data.choices?.[0]?.message?.content || "";
    raw = raw.trim().replace(/^\x60{3}(?:json)?\s*/i,"").replace(/\s*\x60{3}$/,"");
    const first = raw.indexOf("{"), last = raw.lastIndexOf("}");
    if (first < 0 || last <= first) throw new Error("مدل طرح تصویری معتبری برنگرداند.");
    const scene = JSON.parse(raw.slice(first,last+1));
    status.remove();
    const card = document.createElement("section");
    card.className = "message assistant image-result";
    const heading = document.createElement("strong");
    heading.textContent = "PixAI ImageEngine · " + (scene.title || "تصویر دوبعدی");
    const stage = document.createElement("div");
    stage.className = "image-engine-stage";
    const actions = document.createElement("div");
    actions.className = "image-engine-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.textContent = "⬇ ذخیره تصویر PNG";
    actions.appendChild(save);
    card.append(heading,stage,actions);
    messagesEl.appendChild(card);
    const result = window.PixAIImageEngine.render(stage,scene);
    save.addEventListener("click",() => result.download());
    messagesEl.scrollTop = messagesEl.scrollHeight;
  } catch (error) {
    status.remove();
    addMessage("assistant",String(error.message || error),"error");
  } finally {
    setBusy(false);
    promptEl.focus();
  }
}

async function sendMessage(text) {
  const clean = text.trim();
  if (!clean || busy) return;
  if (imageMode) { promptEl.value = ''; promptEl.style.height = 'auto'; createPixAIImage(clean); return; }
  if (videoMode) { promptEl.value = ''; promptEl.style.height = 'auto'; createMotionVideo(clean); return; }
  const config = getApiConfig();
  if (!config) {
    addMessage("assistant", "اتصال PixAI تنظیم نشد. توکن خصوصی را وارد کن تا ارتباط برقرار شود.", "error");
    return;
  }
  if (welcome?.isConnected) welcome.remove();
  addMessage("user", clean);
  history.push({ role: "user", content: clean });
  persistActiveChat();
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
        client_id: PIXAI_CLIENT_ID,
        reasoning_level: codeMode ? 1 : reasoningLevel,
        recent_chats: codeMode ? [] : getRecentChatsForRequest(),
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
    persistActiveChat();
    const imageData = data?.images?.[0]?.b64_json || null;
    addMessage("assistant", answer, "", imageData);
    const sources = Array.isArray(data?.sources) ? data.sources : [];
    if (sources.length) {
      const sourcePanel = document.createElement("div");
      sourcePanel.className = "message assistant web-sources";
      const heading = document.createElement("strong");
      heading.textContent = "منابع وب";
      sourcePanel.appendChild(heading);
      sources.forEach((source, index) => {
        if (!source?.url || !source.url.startsWith("https://")) return;
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "[" + (index + 1) + "] " + (source.title || "منبع");
        sourcePanel.appendChild(link);
      });
      if (sourcePanel.children.length > 1) messagesEl.appendChild(sourcePanel);
    }
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
    persistActiveChat();
  } finally {
    setBusy(false);
    promptEl.focus();
  }
}

const micBtn = document.getElementById("micBtn");
let recognition = null;
let listening = false;
let speechBaseText = "";
function resizePrompt() {
  promptEl.style.height = "auto";
  promptEl.style.height = Math.min(promptEl.scrollHeight, 130) + "px";
}
function setMicState(active) {
  listening = active;
  if (!micBtn) return;
  micBtn.classList.toggle("recording", active);
  micBtn.setAttribute("aria-pressed", String(active));
  micBtn.title = active ? "توقف ضبط صدا" : "تایپ صوتی فارسی";
  micBtn.textContent = active ? "■" : "🎙";
}
function startVoiceTyping() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    addMessage("assistant", "این مرورگر قابلیت تشخیص گفتار را ندارد. از مرورگر دیگری که Speech Recognition را پشتیبانی می‌کند استفاده کن.", "error");
    return;
  }
  if (recognition && listening) {
    recognition.stop();
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "fa-IR";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  speechBaseText = promptEl.value.trim();
  setMicState(true);
  recognition.onresult = event => {
    let finalText = "";
    let interimText = "";
    for (let i = 0; i < event.results.length; i++) {
      const part = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += part;
      else interimText += part;
    }
    const spoken = (finalText + (interimText ? " " + interimText : "")).trim();
    promptEl.value = [speechBaseText, spoken].filter(Boolean).join(speechBaseText ? " " : "");
    resizePrompt();
  };
  recognition.onerror = event => {
    const messages = {
      "not-allowed": "دسترسی میکروفون داده نشد. اجازهٔ استفاده از میکروفون را در مرورگر بررسی کن.",
      "language-not-supported": "این مرورگر یا سرویس گفتار، زبان فارسی (fa-IR) را پشتیبانی نمی‌کند.",
      "network": "سرویس تشخیص گفتار به شبکه وصل نشد.",
      "no-speech": "صدایی تشخیص داده نشد؛ دوباره امتحان کن."
    };
    addMessage("assistant", messages[event.error] || ("تایپ صوتی با خطا روبه‌رو شد: " + event.error), "error");
  };
  recognition.onend = () => setMicState(false);
  try {
    recognition.start();
  } catch (error) {
    setMicState(false);
    addMessage("assistant", "شروع تایپ صوتی ممکن نشد. کمی صبر کن و دوباره امتحان کن.", "error");
  }
}
micBtn?.addEventListener("click", startVoiceTyping);

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


imageModeButton?.addEventListener("click", () => {
  if (busy) return;
  imageMode = !imageMode;
  videoMode = false;
  codeMode = false;
  videoModeButton?.classList.remove("active");
  codeModeButton?.classList.remove("active");
  archiveCurrentChat();
  history = [];
  messagesEl.innerHTML = "";
  const panel = document.createElement("div");
  panel.className = "welcome";
  panel.innerHTML = imageMode
    ? '<div class="welcome-icon">🎨</div><h1>PixAI ImageEngine</h1><p>درخواست فارسی بنویس؛ موتور اختصاصی Canvas تصویر دوبعدی می‌سازد.</p><p class="image-engine-status">رندر روی دستگاه · بدون API پولی تصویرساز · خروجی PNG</p>'
    : '<div class="welcome-icon">✦</div><h1>سلام! من PixAI هستم</h1><p>هر چیزی می‌خوای بپرس؛ از همین‌جا شروع کنیم.</p>';
  messagesEl.appendChild(panel);
  imageModeButton.classList.toggle("active",imageMode);
  promptEl.placeholder = imageMode ? "تصویری که می‌خوای بسازی رو توصیف کن..." : "پیامت رو اینجا بنویس...";
  updateCodeMode();
  promptEl.focus();
});

videoModeButton?.addEventListener('click', () => {
  if (busy) return;
  imageMode = false;
  imageModeButton?.classList.remove('active');
  videoMode = !videoMode;
  codeMode = false;
  archiveCurrentChat();
  history = [];
  messagesEl.innerHTML = '';
  const panel = document.createElement('div');
  panel.className = 'welcome';
  panel.innerHTML = videoMode ? '<div class="welcome-icon">🎬</div><h1>PixAI Motion Engine</h1><p>دستور فارسی بنویس؛ LLM صحنه را طراحی می‌کند و موتور Canvas آن را روی دستگاه متحرک می‌سازد.</p><p class="video-status">رندر محلی · بدون API پولی ویدیوساز · خروجی WebM</p>' : '<div class="welcome-icon">✦</div><h1>سلام! من PixAI هستم</h1><p>هر چیزی می‌خوای بپرس؛ از همین‌جا شروع کنیم.</p>';
  messagesEl.appendChild(panel);
  videoModeButton.classList.toggle('active', videoMode);
  codeModeButton?.classList.toggle("active", codeMode);
  promptEl.placeholder = videoMode ? 'صحنه انیمیشن دوبعدی رو توصیف کن...' : 'پیامت رو اینجا بنویس...';
  promptEl.focus();
});


codeModeButton?.addEventListener("click", () => {
  videoMode = false;
  imageMode = false;
  imageModeButton?.classList.remove('active');
  videoModeButton?.classList.remove('active');
  if (busy) return;
  codeMode = !codeMode;
  archiveCurrentChat();
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
  imageMode = false;
  imageModeButton?.classList.remove("active");
  videoModeButton?.classList.remove("active");
  promptEl.placeholder = "پیامت رو اینجا بنویس...";
  archiveCurrentChat();
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
