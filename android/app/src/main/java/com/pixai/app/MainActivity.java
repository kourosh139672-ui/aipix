package com.pixai.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.BitmapFactory;
import android.media.MediaPlayer;
import android.net.Uri;
import android.util.Base64;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.*;
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String API = "https://aipix-api.kourosh-1396-72.workers.dev";
    private static final String SYSTEM = "تو PixAI هستی، دستیار فارسی‌زبان PixCore 1. به فارسی روان، دقیق و طبیعی پاسخ بده. از تاریخچه همین گفتگو استفاده کن. اگر ابزاری در دسترس نیست، صادقانه بگو و ادعای موفقیت نکن.";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ArrayList<JSONObject> history = new ArrayList<>();
    private final ArrayList<JSONObject> conversations = new ArrayList<>();
    private String currentConversationId;
    private String clientId;
    private int reasoningLevel;
    private boolean memoryEnabled;
    private boolean lightTheme;
    private String personalNotes;
    private LinearLayout root, messageList;
    private FrameLayout screenFrame;
    private View menuScrim;
    private LinearLayout sidePanel;
    private ScrollView scroll;
    private EditText composer;
    private TextView sendButton;
    private boolean busy = false;
    private MediaPlayer audioPlayer;
    private static class ChatResult { String text; String imagePath; String audioPath; String videoUrl; }
    private String confirmedVideoPrompt;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(33,33,33));
        getWindow().setNavigationBarColor(Color.rgb(33,33,33));
        getWindow().setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        clientId = getPreferences(0).getString("client_id", "");
        if (clientId.isEmpty()) {
            clientId = UUID.randomUUID().toString().replace("-", "");
            getPreferences(0).edit().putString("client_id", clientId).apply();
        }
        reasoningLevel = getPreferences(0).getInt("reasoning_level", 2);
        memoryEnabled = getPreferences(0).getBoolean("memory_enabled", true);
        lightTheme = getPreferences(0).getBoolean("light_theme", false);
        personalNotes = getPreferences(0).getString("personal_notes", "");
        restoreHistory();
        buildInterface();
        renderHistory();
    }

    private int dp(float value) {
        return (int)(value * getResources().getDisplayMetrics().density + 0.5f);
    }

    private GradientDrawable rounded(int color, int radius) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radius));
        return d;
    }

    private TextView text(String value, int size, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(value);
        t.setTextSize(size);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return t;
    }

    private TextView action(String value) {
        TextView t = text(value, 22, Color.WHITE, false);
        t.setGravity(Gravity.CENTER);
        t.setBackground(rounded(Color.TRANSPARENT, 24));
        return t;
    }

    private void buildInterface() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(lightTheme ? 0xfff7f7f7 : 0xff212121);
        screenFrame = new FrameLayout(this);
        screenFrame.setBackgroundColor(lightTheme ? 0xfff7f7f7 : 0xff212121);
        screenFrame.addView(root, new FrameLayout.LayoutParams(-1, -1));
        setContentView(screenFrame);

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(12), dp(8), dp(12), dp(8));
        top.setBackgroundColor(lightTheme ? 0xfff7f7f7 : 0xff212121);

        TextView historyButton = action("☰");
        historyButton.setTextColor(lightTheme ? 0xff202020 : Color.WHITE);
        top.addView(historyButton, new LinearLayout.LayoutParams(dp(42), dp(42)));
        historyButton.setOnClickListener(v -> showSideMenu());

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.VERTICAL);
        brand.setGravity(Gravity.CENTER);
        TextView title = text("PixAI", 19, lightTheme ? 0xff202020 : Color.WHITE, true);
        TextView model = text("PixCore 1  ▾", 11, 0xffb4b4b4, false);
        brand.addView(title);
        brand.addView(model);
        top.addView(brand, new LinearLayout.LayoutParams(0, -2, 1));

        TextView newChat = action("＋");
        newChat.setTextColor(lightTheme ? 0xff202020 : Color.WHITE);
        top.addView(newChat, new LinearLayout.LayoutParams(dp(42), dp(42)));
        newChat.setOnClickListener(v -> newChat());
        root.addView(top);

        View line = new View(this);
        line.setBackgroundColor(0xff343434);
        root.addView(line, new LinearLayout.LayoutParams(-1, dp(1)));

        scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(lightTheme ? 0xfff7f7f7 : 0xff212121);
        scroll.setClipToPadding(false);
        messageList = new LinearLayout(this);
        messageList.setOrientation(LinearLayout.VERTICAL);
        messageList.setPadding(dp(16), dp(18), dp(16), dp(18));
        scroll.addView(messageList);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout composerArea = new LinearLayout(this);
        composerArea.setOrientation(LinearLayout.VERTICAL);
        composerArea.setPadding(dp(12), dp(8), dp(12), dp(4));
        composerArea.setBackgroundColor(lightTheme ? 0xfff7f7f7 : 0xff212121);

        LinearLayout inputShell = new LinearLayout(this);
        inputShell.setGravity(Gravity.BOTTOM | Gravity.CENTER_VERTICAL);
        inputShell.setPadding(dp(8), dp(5), dp(7), dp(5));
        inputShell.setBackground(rounded(lightTheme ? 0xffe9e9e9 : 0xff303030, 27));

        composer = new EditText(this);
        composer.setTextColor(lightTheme ? 0xff202020 : Color.WHITE);
        composer.setHintTextColor(lightTheme ? 0xff777777 : 0xffa5a5a5);
        composer.setHint("پیامی برای PixAI بنویس...");
        composer.setTextSize(15);
        composer.setPadding(dp(10), dp(9), dp(8), dp(9));
        composer.setBackgroundColor(Color.TRANSPARENT);
        composer.setMinLines(1);
        composer.setMaxLines(5);
        composer.setGravity(Gravity.RIGHT | Gravity.CENTER_VERTICAL);
        composer.setImeOptions(EditorInfo.IME_ACTION_SEND);
        inputShell.addView(composer, new LinearLayout.LayoutParams(0, -2, 1));

        TextView mic = action("🎙");
        inputShell.addView(mic, new LinearLayout.LayoutParams(dp(40), dp(42)));
        mic.setOnClickListener(v -> startVoice());

        sendButton = text("↑", 25, Color.WHITE, true);
        sendButton.setGravity(Gravity.CENTER);
        sendButton.setBackground(rounded(0xfff1f1f1, 24));
        sendButton.setTextColor(0xff202020);
        inputShell.addView(sendButton, new LinearLayout.LayoutParams(dp(40), dp(40)));
        sendButton.setOnClickListener(v -> sendMessage());
        composer.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEND) {
                sendMessage();
                return true;
            }
            return false;
        });

        composerArea.addView(inputShell);
        TextView disclaimer = text("PixAI ممکن است اشتباه کند؛ پاسخ‌های مهم را بررسی کن.", 10, 0xff999999, false);
        disclaimer.setGravity(Gravity.CENTER);
        disclaimer.setPadding(0, dp(7), 0, dp(3));
        composerArea.addView(disclaimer);
        root.addView(composerArea);
    }

    private void renderHistory() {
        messageList.removeAllViews();
        if (history.isEmpty()) {
            LinearLayout welcome = new LinearLayout(this);
            welcome.setOrientation(LinearLayout.VERTICAL);
            welcome.setGravity(Gravity.CENTER);
            welcome.setPadding(dp(12), dp(28), dp(12), dp(28));
            TextView logo = text("✳", 42, lightTheme ? 0xff202020 : Color.WHITE, true);
            logo.setGravity(Gravity.CENTER);
            welcome.addView(logo);
            TextView greeting = text("امروز چطور می‌تونم کمکت کنم؟", 21, lightTheme ? 0xff202020 : Color.WHITE, true);
            greeting.setGravity(Gravity.CENTER);
            greeting.setPadding(0, dp(12), 0, dp(7));
            welcome.addView(greeting);
            TextView sub = text("با PixCore 1 گفتگو کن", 13, 0xffaaaaaa, false);
            sub.setGravity(Gravity.CENTER);
            welcome.addView(sub);
            messageList.addView(welcome, new LinearLayout.LayoutParams(-1, -1));
            return;
        }
        for (JSONObject item : history) {
            String role = item.optString("role");
            if ("user".equals(role)) addMessage(item.optString("content"), true);
            else if ("assistant".equals(role)) addMessage(item.optString("content"), false,
                    item.optString("image_path", null), item.optString("audio_path", null), item.optString("video_url", null));
        }
        scroll.post(() -> scroll.fullScroll(ScrollView.FOCUS_DOWN));
    }

    private void addMessage(String value, boolean fromUser) {
        addMessage(value, fromUser, null, null, null);
    }

    private void addMessage(String value, boolean fromUser, String imagePath, String audioPath, String videoUrl) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(fromUser ? Gravity.RIGHT : Gravity.LEFT);
        row.setPadding(0, dp(5), 0, dp(5));

        TextView content = text(value, 15, 0xffeeeeee, false);
        content.setTextIsSelectable(true);
        content.setLineSpacing(dp(2), 1.0f);
        content.setPadding(dp(14), dp(11), dp(14), dp(11));
        if (fromUser) {
            content.setBackground(rounded(0xff303030, 20));
            row.addView(content, new LinearLayout.LayoutParams(-2, -2));
        } else {
            TextView mark = text("✳", 17, 0xffeeeeee, true);
            mark.setGravity(Gravity.TOP | Gravity.CENTER_HORIZONTAL);
            LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(dp(28), -2);
            mp.rightMargin = dp(7);
            row.addView(mark, mp);
            row.addView(content, new LinearLayout.LayoutParams(0, -2, 1));
        }
        messageList.addView(row, new LinearLayout.LayoutParams(-1, -2));
        if (!fromUser && imagePath != null) {
            try {
                android.graphics.Bitmap bitmap = BitmapFactory.decodeFile(imagePath);
                if (bitmap != null) {
                    ImageView image = new ImageView(this);
                    image.setImageBitmap(bitmap);
                    image.setAdjustViewBounds(true);
                    image.setScaleType(ImageView.ScaleType.FIT_CENTER);
                    LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(-1, dp(280));
                    ip.leftMargin = dp(35);
                    ip.bottomMargin = dp(8);
                    messageList.addView(image, ip);
                }
            } catch (Exception ignored) {}
        }
        if (!fromUser && audioPath != null) {
            TextView play = text("▶  پخش موسیقی ساخته‌شده", 13, Color.WHITE, true);
            play.setGravity(Gravity.CENTER);
            play.setPadding(dp(14), dp(10), dp(14), dp(10));
            play.setBackground(rounded(0xff3b3b3b, 18));
            LinearLayout.LayoutParams ap = new LinearLayout.LayoutParams(-2, -2);
            ap.leftMargin = dp(35);
            ap.bottomMargin = dp(8);
            messageList.addView(play, ap);
            play.setOnClickListener(v -> playAudio(audioPath));
        }
        if (!fromUser && videoUrl != null && videoUrl.startsWith("https://")) {
            TextView openVideo = text("▶  باز کردن ویدیوی ساخته‌شده", 14, Color.WHITE, true);
            openVideo.setGravity(Gravity.CENTER);
            openVideo.setPadding(dp(14), dp(11), dp(14), dp(11));
            openVideo.setBackground(rounded(0xff3b3b3b, 18));
            LinearLayout.LayoutParams vp = new LinearLayout.LayoutParams(-2, -2);
            vp.leftMargin = dp(35);
            vp.bottomMargin = dp(8);
            messageList.addView(openVideo, vp);
            openVideo.setOnClickListener(v -> {
                try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(videoUrl))); }
                catch (Exception e) { Toast.makeText(this, "بازکردن ویدیو ممکن نشد.", Toast.LENGTH_SHORT).show(); }
            });
        }
    }

    private boolean isVideoGenerationRequest(String question) {
        String q = question.toLowerCase();
        boolean mentionsVideo = q.contains("ویدیو") || q.contains("ویدئو") || q.contains("video");
        boolean asksToCreate = q.contains("بساز") || q.contains("بسازش") || q.contains("تولید کن") || q.contains("ایجاد کن") || q.contains("درست کن") || q.contains("generate") || q.contains("create");
        return mentionsVideo && asksToCreate;
    }

    private void playAudio(String path) {
        try {
            if (audioPlayer != null) { audioPlayer.release(); audioPlayer = null; }
            audioPlayer = new MediaPlayer();
            audioPlayer.setDataSource(path);
            audioPlayer.setOnPreparedListener(player -> player.start());
            audioPlayer.setOnCompletionListener(player -> {
                player.release();
                if (audioPlayer == player) audioPlayer = null;
            });
            audioPlayer.prepareAsync();
        } catch (Exception e) {
            Toast.makeText(this, "پخش فایل صوتی ممکن نشد.", Toast.LENGTH_SHORT).show();
        }
    }

    private String saveBase64(String encoded, String extension) throws Exception {
        byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
        File file = new File(getFilesDir(), "pixai-" + UUID.randomUUID() + extension);
        try (FileOutputStream out = new FileOutputStream(file)) { out.write(bytes); }
        return file.getAbsolutePath();
    }

    private void sendMessage() {
        if (busy) return;
        String question = composer.getText().toString().trim();
        if (question.isEmpty()) return;
        if (isVideoGenerationRequest(question)) {
            composer.setText("");
            addMessage(question, true);
            String unavailable = "به دلیل تمام شدن موجودی سازنده، قابلیت ساخت ویدیو فعلاً غیرفعال شده است.";
            addMessage(unavailable, false);
            try {
                history.add(new JSONObject().put("role", "user").put("content", question));
                history.add(new JSONObject().put("role", "assistant").put("content", unavailable));
                saveHistory();
            } catch (Exception ignored) {}
            return;
        }
        composer.setText("");
        ((InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE))
                .hideSoftInputFromWindow(composer.getWindowToken(), 0);
        try {
            history.add(new JSONObject().put("role", "user").put("content", question));
            saveHistory();
        } catch (Exception ignored) {}
        addMessage(question, true);
        TextView typing = text("PixCore 1 در حال فکر کردن است…", 13, 0xffaaaaaa, false);
        typing.setPadding(dp(36), dp(10), dp(8), dp(12));
        messageList.addView(typing);
        scroll.post(() -> scroll.fullScroll(ScrollView.FOCUS_DOWN));
        busy = true;
        sendButton.setText("…");
        executor.execute(() -> {
            ChatResult answer;
            try { answer = requestChat(question); }
            catch (Exception e) {
                answer = new ChatResult();
                answer.text = "اتصال به سرویس برقرار نشد. لطفاً کمی بعد دوباره تلاش کن.\n" + safe(e);
            }
            final ChatResult result = answer;
            runOnUiThread(() -> {
                messageList.removeView(typing);
                addMessage(result.text, false, result.imagePath, result.audioPath, result.videoUrl);
                try {
                    JSONObject saved = new JSONObject().put("role", "assistant").put("content", result.text);
                    if (result.imagePath != null) saved.put("image_path", result.imagePath);
                    if (result.audioPath != null) saved.put("audio_path", result.audioPath);
                    if (result.videoUrl != null) saved.put("video_url", result.videoUrl);
                    history.add(saved);
                    while (history.size() > 60) history.remove(0);
                    saveHistory();
                } catch (Exception ignored) {}
                busy = false;
                sendButton.setText("↑");
                scroll.post(() -> scroll.fullScroll(ScrollView.FOCUS_DOWN));
            });
        });
    }

    private ChatResult requestChat(String question) throws Exception {
        JSONArray messages = new JSONArray();
        String profile = memoryEnabled ? "\\nنام کاربر را حدس نزن و از نامی که کاربر صریحاً در همین گفتگو تأیید نکرده استفاده نکن. اگر کاربر گفت نامی که به او نسبت داده‌ای اشتباه است، حرف او را بپذیر و دیگر آن نام را به کار نبر. با فارسی روان، صمیمی و محترمانه پاسخ بده. یادداشت‌های شخصی: " + personalNotes + buildCrossChatContext() : "";
        messages.put(new JSONObject().put("role", "system").put("content", SYSTEM + profile));
        int start = Math.max(0, history.size() - 24);
        for (int i = start; i < history.size(); i++) messages.put(history.get(i));
        JSONObject payload = new JSONObject()
                .put("model", "auto")
                .put("client_id", clientId)
                .put("reasoning_level", reasoningLevel)
                .put("messages", messages)
                .put("max_tokens", 1400);
        HttpURLConnection connection = (HttpURLConnection)new URL(API + "/v1/chat/completions").openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(240000);
        connection.setDoOutput(true);
        connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
        try (OutputStream out = connection.getOutputStream()) {
            out.write(payload.toString().getBytes("UTF-8"));
        }
        int code = connection.getResponseCode();
        InputStream stream = code >= 200 && code < 300 ? connection.getInputStream() : connection.getErrorStream();
        String raw = read(stream);
        connection.disconnect();
        JSONObject response;
        try { response = new JSONObject(raw); }
        catch (Exception e) { throw new Exception("پاسخ نامعتبر از سرور (HTTP " + code + ")"); }
        if (code < 200 || code >= 300) { String message = response.optString("error", "HTTP " + code); String detail = response.optString("detail", ""); if (!detail.isEmpty()) message += "\\n" + detail; throw new Exception("HTTP " + code + ": " + message); }
        JSONArray choices = response.optJSONArray("choices");
        if (choices == null || choices.length() == 0) throw new Exception(response.optString("error", "پاسخ خالی از سرور"));
        JSONObject message = choices.getJSONObject(0).optJSONObject("message");
        ChatResult result = new ChatResult();
        result.text = message == null ? "" : message.optString("content", "");
        if (result.text.isEmpty()) result.text = "پاسخ متنی دریافت نشد.";
        JSONArray images = response.optJSONArray("images");
        if (images != null && images.length() > 0) {
            String encoded = images.getJSONObject(0).optString("b64_json", "");
            if (!encoded.isEmpty()) result.imagePath = saveBase64(encoded, ".png");
        }
        JSONObject audio = response.optJSONObject("audio");
        if (audio != null) {
            String encoded = audio.optString("b64_json", "");
            if (!encoded.isEmpty()) result.audioPath = saveBase64(encoded, ".mp3");
        }
        JSONObject video = response.optJSONObject("video");
        if (video != null) result.videoUrl = video.optString("url", null);
        JSONArray sources = response.optJSONArray("sources");
        if (sources != null && sources.length() > 0) {
            StringBuilder sourceText = new StringBuilder(result.text).append("\n\nمنابع جست‌وجو:");
            for (int i = 0; i < sources.length(); i++) {
                JSONObject source = sources.optJSONObject(i);
                if (source != null) sourceText.append("\n[").append(i + 1).append("] ").append(source.optString("title", "منبع")).append("\n").append(source.optString("url", ""));
            }
            result.text = sourceText.toString();
        }
        return result;
    }

    private String read(InputStream stream) throws Exception {
        StringBuilder result = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, "UTF-8"))) {
            String line;
            while ((line = reader.readLine()) != null) result.append(line);
        }
        return result.toString();
    }

    private void newChat() {
        if (busy) return;
        saveHistory();
        currentConversationId = UUID.randomUUID().toString();
        history.clear();
        getPreferences(0).edit().putString("current_conversation", currentConversationId).apply();
        renderHistory();
    }

    private void showHistory() {
        if (conversations.isEmpty()) {
            new AlertDialog.Builder(this).setTitle("گفتگوهای ذخیره‌شده")
                    .setMessage("هنوز گفتگویی ذخیره نشده است.")
                    .setPositiveButton("گفتگوی جدید", (d, w) -> newChat())
                    .setNegativeButton("بستن", null).show();
            return;
        }
        String[] titles = new String[conversations.size()];
        for (int i = 0; i < conversations.size(); i++) {
            titles[i] = conversations.get(i).optString("title", "گفتگوی بدون عنوان");
        }
        new AlertDialog.Builder(this).setTitle("گفتگوهای ذخیره‌شده")
                .setItems(titles, (dialog, which) -> {
                    try {
                        JSONObject selected = conversations.get(which);
                        currentConversationId = selected.optString("id");
                        history.clear();
                        JSONArray messages = selected.optJSONArray("messages");
                        if (messages != null) {
                            for (int i = 0; i < messages.length(); i++) history.add(messages.getJSONObject(i));
                        }
                        getPreferences(0).edit().putString("current_conversation", currentConversationId).apply();
                        renderHistory();
                    } catch (Exception e) {
                        Toast.makeText(this, "بارگذاری گفتگو انجام نشد.", Toast.LENGTH_SHORT).show();
                    }
                })
                .setPositiveButton("گفتگوی جدید", (d, w) -> newChat())
                .setNegativeButton("بستن", null).show();
    }


    private String buildCrossChatContext() {
        StringBuilder context = new StringBuilder("\\nخلاصهٔ زمینه از گفتگوهای قبلی همین برنامه:");
        int included = 0;
        for (int i = conversations.size() - 1; i >= 0 && included < 4; i--) {
            JSONObject conversation = conversations.get(i);
            if (currentConversationId != null && currentConversationId.equals(conversation.optString("id"))) continue;
            JSONArray messages = conversation.optJSONArray("messages");
            if (messages == null || messages.length() == 0) continue;
            context.append("\\nگفتگو: ").append(conversation.optString("title", "بدون عنوان"));
            int start = Math.max(0, messages.length() - 4);
            for (int j = start; j < messages.length(); j++) {
                JSONObject m = messages.optJSONObject(j);
                if (m != null) {
                    String content = m.optString("content", "");
                    if (content.length() > 300) content = content.substring(0, 300);
                    context.append("\\n").append(m.optString("role")).append(": ").append(content);
                }
            }
            included++;
        }
        return included == 0 ? "" : context.toString();
    }

    private void showSideMenu() {
        if (screenFrame == null || sidePanel != null) return;

        menuScrim = new View(this);
        menuScrim.setBackgroundColor(0x99000000);
        screenFrame.addView(menuScrim, new FrameLayout.LayoutParams(-1, -1));
        menuScrim.setOnClickListener(v -> closeSideMenu());

        sidePanel = new LinearLayout(this);
        sidePanel.setOrientation(LinearLayout.VERTICAL);
        sidePanel.setPadding(dp(14), dp(18), dp(14), dp(12));
        sidePanel.setBackgroundColor(lightTheme ? 0xfff5f5f5 : 0xff292929);
        FrameLayout.LayoutParams panelParams = new FrameLayout.LayoutParams(
                Math.min(dp(320), (int)(getResources().getDisplayMetrics().widthPixels * 0.84f)),
                -1, Gravity.RIGHT | Gravity.TOP);
        screenFrame.addView(sidePanel, panelParams);

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(8), dp(5), dp(8), dp(14));
        TextView heading = text("PixAI", 21, lightTheme ? 0xff202020 : Color.WHITE, true);
        header.addView(heading, new LinearLayout.LayoutParams(0, -2, 1));
        TextView close = text("×", 30, lightTheme ? 0xff333333 : Color.WHITE, false);
        close.setGravity(Gravity.CENTER);
        header.addView(close, new LinearLayout.LayoutParams(dp(42), dp(42)));
        close.setOnClickListener(v -> closeSideMenu());
        sidePanel.addView(header);

        View divider = new View(this);
        divider.setBackgroundColor(lightTheme ? 0xffdddddd : 0xff444444);
        sidePanel.addView(divider, new LinearLayout.LayoutParams(-1, dp(1)));

        ScrollView chatScroll = new ScrollView(this);
        chatScroll.setFillViewport(false);
        LinearLayout chatItems = new LinearLayout(this);
        chatItems.setOrientation(LinearLayout.VERTICAL);
        chatItems.setPadding(0, dp(8), 0, dp(8));

        TextView newChatItem = text("＋  گفتگوی جدید", 15,
                lightTheme ? 0xff202020 : Color.WHITE, true);
        newChatItem.setGravity(Gravity.CENTER_VERTICAL);
        newChatItem.setPadding(dp(12), dp(14), dp(12), dp(14));
        chatItems.addView(newChatItem, new LinearLayout.LayoutParams(-1, -2));
        newChatItem.setOnClickListener(v -> {
            closeSideMenu();
            newChat();
        });

        TextView chatsTitle = text("چت‌ها", 12, 0xff999999, true);
        chatsTitle.setPadding(dp(12), dp(12), dp(12), dp(7));
        chatItems.addView(chatsTitle);

        for (int i = 0; i < conversations.size(); i++) {
            final JSONObject conversation = conversations.get(i);
            final String id = conversation.optString("id");
            String title = conversation.optString("title", "گفتگوی بدون عنوان");
            if (title.length() > 34) title = title.substring(0, 34) + "…";
            TextView chat = text("  " + title, 14,
                    lightTheme ? 0xff303030 : 0xffeeeeee, false);
            chat.setGravity(Gravity.CENTER_VERTICAL);
            chat.setSingleLine(true);
            chat.setEllipsize(android.text.TextUtils.TruncateAt.END);
            chat.setPadding(dp(12), dp(13), dp(12), dp(13));
            if (id.equals(currentConversationId)) {
                chat.setBackground(rounded(lightTheme ? 0xffe3e3e3 : 0xff3a3a3a, 12));
            }
            chatItems.addView(chat, new LinearLayout.LayoutParams(-1, -2));
            chat.setOnClickListener(v -> {
                closeSideMenu();
                loadConversation(conversation);
            });
        }

        chatScroll.addView(chatItems);
        sidePanel.addView(chatScroll, new LinearLayout.LayoutParams(-1, 0, 1));

        View bottomDivider = new View(this);
        bottomDivider.setBackgroundColor(lightTheme ? 0xffdddddd : 0xff444444);
        sidePanel.addView(bottomDivider, new LinearLayout.LayoutParams(-1, dp(1)));

        TextView settingsItem = text("⚙   تنظیمات", 16,
                lightTheme ? 0xff202020 : Color.WHITE, true);
        settingsItem.setGravity(Gravity.CENTER_VERTICAL);
        settingsItem.setPadding(dp(12), dp(16), dp(12), dp(12));
        sidePanel.addView(settingsItem, new LinearLayout.LayoutParams(-1, -2));
        settingsItem.setOnClickListener(v -> {
            closeSideMenu();
            showSettings();
        });
    }

    private void closeSideMenu() {
        if (screenFrame == null) return;
        if (menuScrim != null) screenFrame.removeView(menuScrim);
        if (sidePanel != null) screenFrame.removeView(sidePanel);
        menuScrim = null;
        sidePanel = null;
    }

    private void loadConversation(JSONObject selected) {
        if (busy) return;
        try {
            currentConversationId = selected.optString("id");
            history.clear();
            JSONArray messages = selected.optJSONArray("messages");
            if (messages != null) {
                for (int i = 0; i < messages.length(); i++) history.add(messages.getJSONObject(i));
            }
            getPreferences(0).edit().putString("current_conversation", currentConversationId).apply();
            renderHistory();
        } catch (Exception e) {
            Toast.makeText(this, "بارگذاری گفتگو انجام نشد.", Toast.LENGTH_SHORT).show();
        }
    }

    private void showSettings() {
        if (screenFrame == null) return;
        closeSideMenu();
        menuScrim = new View(this);
        menuScrim.setBackgroundColor(0x99000000);
        screenFrame.addView(menuScrim, new FrameLayout.LayoutParams(-1, -1));
        menuScrim.setOnClickListener(v -> closeSideMenu());

        sidePanel = new LinearLayout(this);
        sidePanel.setOrientation(LinearLayout.VERTICAL);
        sidePanel.setPadding(dp(16), dp(18), dp(16), dp(14));
        sidePanel.setBackgroundColor(lightTheme ? 0xfff5f5f5 : 0xff292929);
        FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                Math.min(dp(340), (int)(getResources().getDisplayMetrics().widthPixels * 0.88f)),
                -1, Gravity.RIGHT | Gravity.TOP);
        screenFrame.addView(sidePanel, params);

        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView back = text("‹", 30, lightTheme ? 0xff202020 : Color.WHITE, false);
        back.setGravity(Gravity.CENTER);
        header.addView(back, new LinearLayout.LayoutParams(dp(42), dp(42)));
        back.setOnClickListener(v -> { closeSideMenu(); showSideMenu(); });
        TextView title = text("تنظیمات", 21, lightTheme ? 0xff202020 : Color.WHITE, true);
        title.setPadding(dp(10), 0, 0, 0);
        header.addView(title, new LinearLayout.LayoutParams(0, -2, 1));
        TextView close = text("×", 28, lightTheme ? 0xff202020 : Color.WHITE, false);
        close.setGravity(Gravity.CENTER);
        header.addView(close, new LinearLayout.LayoutParams(dp(40), dp(42)));
        close.setOnClickListener(v -> closeSideMenu());
        sidePanel.addView(header);

        TextView subtitle = text("شخصی‌سازی تجربهٔ PixAI", 13, 0xff999999, false);
        subtitle.setPadding(dp(10), dp(4), dp(10), dp(18));
        sidePanel.addView(subtitle);

        addSettingsRow("حافظه", "مدیریت اطلاعات ذخیره‌شده", "▤", () -> memorySettings());
        addSettingsRow("اندازهٔ تفکر", "تنظیم میزان بررسی و استدلال", "✳", () -> reasoningSettings());
        addSettingsRow("ظاهر برنامه", "حالت روشن یا تیره", "◐", () -> appearanceSettings());
        addSettingsRow("شخصی‌سازی", "تنظیم ترجیحات پاسخ‌گویی", "⚙", () -> personalizationSettings());
    }

    private void addSettingsRow(String title, String detail, String symbol, Runnable action) {
        LinearLayout item = new LinearLayout(this);
        item.setOrientation(LinearLayout.VERTICAL);
        item.setPadding(dp(13), dp(13), dp(13), dp(13));
        item.setBackground(rounded(lightTheme ? 0xffeaeaea : 0xff353535, 15));
        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView icon = text(symbol, 20, lightTheme ? 0xff333333 : Color.WHITE, true);
        top.addView(icon, new LinearLayout.LayoutParams(dp(38), -2));
        TextView label = text(title, 15, lightTheme ? 0xff202020 : Color.WHITE, true);
        top.addView(label, new LinearLayout.LayoutParams(0, -2, 1));
        TextView arrow = text("‹", 24, 0xff999999, false);
        top.addView(arrow);
        item.addView(top);
        TextView description = text(detail, 12, 0xff999999, false);
        description.setPadding(dp(38), dp(5), 0, 0);
        item.addView(description);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.bottomMargin = dp(9);
        sidePanel.addView(item, lp);
        item.setOnClickListener(v -> {
            closeSideMenu();
            action.run();
        });
    }

    private void memorySettings() {
        String[] items = {memoryEnabled ? "خاموش‌کردن حافظه" : "روشن‌کردن حافظه", "مشاهدهٔ اطلاعات ذخیره‌شده", "پاک‌کردن اطلاعات ذخیره‌شده"};
        new AlertDialog.Builder(this).setTitle("مدیریت حافظه")
                .setItems(items, (d, which) -> {
                    if (which == 0) {
                        memoryEnabled = !memoryEnabled;
                        getPreferences(0).edit().putBoolean("memory_enabled", memoryEnabled).apply();
                        Toast.makeText(this, memoryEnabled ? "حافظه روشن شد." : "حافظه خاموش شد.", Toast.LENGTH_SHORT).show();
                    } else if (which == 1) {
                        new AlertDialog.Builder(this).setTitle("حافظهٔ PixAI")
                                .setMessage((personalNotes.isEmpty() ? "نام یا اطلاعات شخصی تأییدشده‌ای ذخیره نشده." : personalNotes))
                                .setPositiveButton("بستن", null).show();
                    } else {
                        personalNotes = "";
                        getPreferences(0).edit().remove("personal_notes").apply();
                        Toast.makeText(this, "یادداشت‌های شخصی پاک شدند.", Toast.LENGTH_SHORT).show();
                    }
                }).show();
    }

    private void reasoningSettings() {
        String[] levels = {"۱ - سریع", "۲ - متعادل", "۳ - عمیق"};
        new AlertDialog.Builder(this).setTitle("اندازهٔ تفکر")
                .setSingleChoiceItems(levels, reasoningLevel - 1, (d, which) -> {
                    reasoningLevel = which + 1;
                    getPreferences(0).edit().putInt("reasoning_level", reasoningLevel).apply();
                    d.dismiss();
                }).setNegativeButton("بستن", null).show();
    }

    private void appearanceSettings() {
        String[] themes = {"تیره", "روشن"};
        new AlertDialog.Builder(this).setTitle("ظاهر برنامه")
                .setSingleChoiceItems(themes, lightTheme ? 1 : 0, (d, which) -> {
                    lightTheme = which == 1;
                    getPreferences(0).edit().putBoolean("light_theme", lightTheme).apply();
                    d.dismiss();
                    buildInterface();
                    renderHistory();
                }).setNegativeButton("بستن", null).show();
    }

    private void personalizationSettings() {
        EditText input = new EditText(this);
        input.setText(personalNotes);
        input.setHint("مثلاً موضوعات مورد علاقه یا ترجیح پاسخ‌گویی");
        input.setMinLines(3);
        new AlertDialog.Builder(this).setTitle("شخصی‌سازی")
                .setMessage("یادداشت‌های غیرحساس برای گفتگوهای بعدی")
                .setView(input)
                .setPositiveButton("ذخیره", (d, w) -> {
                    personalNotes = input.getText().toString().trim();
                    if (personalNotes.length() > 700) personalNotes = personalNotes.substring(0, 700);
                    getPreferences(0).edit().putString("personal_notes", personalNotes).apply();
                }).setNegativeButton("لغو", null).show();
    }

    private void startVoice() {
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "fa-IR");
            intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "صحبت کن");
            startActivityForResult(intent, 212);
        } catch (Exception e) {
            Toast.makeText(this, "تشخیص گفتار روی این دستگاه در دسترس نیست.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == 212 && result == RESULT_OK && data != null) {
            ArrayList<String> matches = data.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            if (matches != null && !matches.isEmpty()) composer.setText(matches.get(0));
        }
    }

    private void restoreHistory() {
        try {
            String stored = getPreferences(0).getString("conversations", "");
            if (!stored.isEmpty()) {
                JSONArray all = new JSONArray(stored);
                for (int i = 0; i < all.length(); i++) conversations.add(all.getJSONObject(i));
            }
            currentConversationId = getPreferences(0).getString("current_conversation", "");
            if (currentConversationId.isEmpty()) currentConversationId = UUID.randomUUID().toString();

            JSONObject active = findConversation(currentConversationId);
            if (active == null) {
                JSONArray legacy = new JSONArray(getPreferences(0).getString("history", "[]"));
                if (legacy.length() > 0) {
                    active = new JSONObject().put("id", currentConversationId)
                            .put("title", legacy.optJSONObject(0) == null ? "گفتگوی قبلی" :
                                    legacy.optJSONObject(0).optString("content", "گفتگوی قبلی"))
                            .put("messages", legacy);
                    conversations.add(active);
                } else {
                    active = new JSONObject().put("id", currentConversationId)
                            .put("title", "گفتگوی جدید").put("messages", new JSONArray());
                    conversations.add(active);
                }
            }
            JSONArray messages = active.optJSONArray("messages");
            if (messages != null) for (int i = 0; i < messages.length(); i++) history.add(messages.getJSONObject(i));
            getPreferences(0).edit().putString("current_conversation", currentConversationId).apply();
            persistConversations();
        } catch (Exception ignored) {
            if (currentConversationId == null || currentConversationId.isEmpty()) currentConversationId = UUID.randomUUID().toString();
        }
    }

    private JSONObject findConversation(String id) {
        for (JSONObject item : conversations) if (id.equals(item.optString("id"))) return item;
        return null;
    }

    private void saveHistory() {
        try {
            JSONObject active = findConversation(currentConversationId);
            if (active == null) {
                active = new JSONObject().put("id", currentConversationId)
                        .put("title", "گفتگوی جدید").put("messages", new JSONArray());
                conversations.add(0, active);
            }
            JSONArray messages = new JSONArray();
            for (JSONObject item : history) messages.put(item);
            String title = "گفتگوی جدید";
            for (JSONObject item : history) {
                if ("user".equals(item.optString("role"))) {
                    title = item.optString("content", "گفتگوی جدید");
                    if (title.length() > 42) title = title.substring(0, 42) + "…";
                    break;
                }
            }
            active.put("title", title);
            active.put("messages", messages);
            persistConversations();
        } catch (Exception ignored) {}
    }

    private void persistConversations() {
        JSONArray all = new JSONArray();
        for (JSONObject item : conversations) all.put(item);
        getPreferences(0).edit()
                .putString("conversations", all.toString())
                .putString("current_conversation", currentConversationId)
                .apply();
    }

    private String safe(Exception error) {
        return error.getMessage() == null ? "خطای نامشخص" : error.getMessage();
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        if (audioPlayer != null) { audioPlayer.release(); audioPlayer = null; }
        super.onDestroy();
    }
}
