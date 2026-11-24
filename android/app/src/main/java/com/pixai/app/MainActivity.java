package com.pixai.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.Gravity;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.content.Context;
import android.widget.*;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final String API = "https://aipix-mobile.kourosh-1396-72.workers.dev";
    private static final String SYSTEM = "تو PixAI هستی، دستیار فارسی‌زبان PixCore 1. به فارسی روان، دقیق و طبیعی پاسخ بده. از تاریخچه همین گفتگو استفاده کن. اگر ابزاری در دسترس نیست، صادقانه بگو و ادعای موفقیت نکن.";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ArrayList<JSONObject> history = new ArrayList<>();
    private String clientId;
    private LinearLayout root, messageList;
    private ScrollView scroll;
    private EditText composer;
    private TextView sendButton;
    private boolean busy = false;

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
        root.setBackgroundColor(0xff212121);
        setContentView(root);

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(12), dp(8), dp(12), dp(8));
        top.setBackgroundColor(0xff212121);

        TextView historyButton = action("☰");
        top.addView(historyButton, new LinearLayout.LayoutParams(dp(42), dp(42)));
        historyButton.setOnClickListener(v -> showHistory());

        LinearLayout brand = new LinearLayout(this);
        brand.setOrientation(LinearLayout.VERTICAL);
        brand.setGravity(Gravity.CENTER);
        TextView title = text("PixAI", 19, Color.WHITE, true);
        TextView model = text("PixCore 1  ▾", 11, 0xffb4b4b4, false);
        brand.addView(title);
        brand.addView(model);
        top.addView(brand, new LinearLayout.LayoutParams(0, -2, 1));

        TextView newChat = action("＋");
        top.addView(newChat, new LinearLayout.LayoutParams(dp(42), dp(42)));
        newChat.setOnClickListener(v -> newChat());
        root.addView(top);

        View line = new View(this);
        line.setBackgroundColor(0xff343434);
        root.addView(line, new LinearLayout.LayoutParams(-1, dp(1)));

        scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setClipToPadding(false);
        messageList = new LinearLayout(this);
        messageList.setOrientation(LinearLayout.VERTICAL);
        messageList.setPadding(dp(16), dp(18), dp(16), dp(18));
        scroll.addView(messageList);
        root.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));

        LinearLayout composerArea = new LinearLayout(this);
        composerArea.setOrientation(LinearLayout.VERTICAL);
        composerArea.setPadding(dp(12), dp(8), dp(12), dp(4));
        composerArea.setBackgroundColor(0xff212121);

        LinearLayout inputShell = new LinearLayout(this);
        inputShell.setGravity(Gravity.BOTTOM | Gravity.CENTER_VERTICAL);
        inputShell.setPadding(dp(8), dp(5), dp(7), dp(5));
        inputShell.setBackground(rounded(0xff303030, 27));

        composer = new EditText(this);
        composer.setTextColor(Color.WHITE);
        composer.setHintTextColor(0xffa5a5a5);
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
            TextView logo = text("✳", 42, Color.WHITE, true);
            logo.setGravity(Gravity.CENTER);
            welcome.addView(logo);
            TextView greeting = text("امروز چطور می‌تونم کمکت کنم؟", 21, Color.WHITE, true);
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
            else if ("assistant".equals(role)) addMessage(item.optString("content"), false);
        }
        scroll.post(() -> scroll.fullScroll(ScrollView.FOCUS_DOWN));
    }

    private void addMessage(String value, boolean fromUser) {
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
    }

    private void sendMessage() {
        if (busy) return;
        String question = composer.getText().toString().trim();
        if (question.isEmpty()) return;
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
            String answer;
            try { answer = requestChat(question); }
            catch (Exception e) { answer = "اتصال به سرویس برقرار نشد. لطفاً کمی بعد دوباره تلاش کن.\n" + safe(e); }
            final String result = answer;
            runOnUiThread(() -> {
                messageList.removeView(typing);
                addMessage(result, false);
                try {
                    history.add(new JSONObject().put("role", "assistant").put("content", result));
                    while (history.size() > 60) history.remove(0);
                    saveHistory();
                } catch (Exception ignored) {}
                busy = false;
                sendButton.setText("↑");
                scroll.post(() -> scroll.fullScroll(ScrollView.FOCUS_DOWN));
            });
        });
    }

    private String requestChat(String question) throws Exception {
        JSONArray messages = new JSONArray();
        messages.put(new JSONObject().put("role", "system").put("content", SYSTEM));
        int start = Math.max(0, history.size() - 24);
        for (int i = start; i < history.size(); i++) messages.put(history.get(i));
        JSONObject payload = new JSONObject()
                .put("model", "auto")
                .put("client_id", clientId)
                .put("reasoning_level", 2)
                .put("messages", messages)
                .put("max_tokens", 1400);
        HttpURLConnection connection = (HttpURLConnection)new URL(API + "/v1/chat/completions").openConnection();
        connection.setRequestMethod("POST");
        connection.setConnectTimeout(20000);
        connection.setReadTimeout(120000);
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
        if (code < 200 || code >= 300) throw new Exception(response.optString("error", "HTTP " + code));
        JSONArray choices = response.optJSONArray("choices");
        if (choices == null || choices.length() == 0) throw new Exception(response.optString("error", "پاسخ خالی از سرور"));
        JSONObject message = choices.getJSONObject(0).optJSONObject("message");
        String content = message == null ? "" : message.optString("content", "");
        if (content.isEmpty()) content = "پاسخ متنی دریافت نشد.";
        return content;
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
        history.clear();
        saveHistory();
        renderHistory();
    }

    private void showHistory() {
        new AlertDialog.Builder(this)
                .setTitle("گفتگوی فعلی")
                .setMessage("تاریخچهٔ این نسخه روی همین دستگاه نگهداری می‌شود.")
                .setPositiveButton("گفتگوی جدید", (d, w) -> newChat())
                .setNegativeButton("بستن", null)
                .show();
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
            JSONArray saved = new JSONArray(getPreferences(0).getString("history", "[]"));
            for (int i = 0; i < saved.length(); i++) history.add(saved.getJSONObject(i));
        } catch (Exception ignored) {}
    }

    private void saveHistory() {
        JSONArray saved = new JSONArray();
        for (JSONObject item : history) saved.put(item);
        getPreferences(0).edit().putString("history", saved.toString()).apply();
    }

    private String safe(Exception error) {
        return error.getMessage() == null ? "خطای نامشخص" : error.getMessage();
    }

    @Override protected void onDestroy() {
        executor.shutdownNow();
        super.onDestroy();
    }
}
