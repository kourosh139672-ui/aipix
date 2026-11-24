package com.pixai.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;
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
    private static final String API_URL = "https://aipix-api.kourosh-1396-72.workers.dev";
    private static final String PREFS = "pixai_native";
    private static final String SYSTEM = "تو PixAI هستی، دستیار هوش مصنوعی فارسی‌زبان. به زبان کاربر، روان و دقیق پاسخ بده. از پیام‌های قبلی همین گفتگو استفاده کن. اگر ابزار لازم در دسترس نیست، صادقانه بگو و ادعای انجام کار نکن.";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private final ArrayList<JSONObject> history = new ArrayList<>();
    private LinearLayout root, messages, header;
    private ScrollView scroll;
    private EditText composer;
    private Button send;
    private TextView status;
    private int reasoningLevel = 1;
    private String clientId;
    private boolean busy = false;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(15, 18, 32));
        getWindow().setNavigationBarColor(Color.rgb(15, 18, 32));
        getWindow().getDecorView().setSystemUiVisibility(0);
        clientId = getPreferences(0).getString("client_id", null);
        if (clientId == null) {
            clientId = UUID.randomUUID().toString();
            getPreferences(0).edit().putString("client_id", clientId).apply();
        }
        reasoningLevel = getPreferences(0).getInt("reasoning", 1);
        buildUi();
        restoreHistory();
        if (getPreferences(0).getString("api_token", "").isEmpty()) showSettings();
    }

    private int dp(float v) { return (int)(v * getResources().getDisplayMetrics().density + 0.5f); }
    private GradientDrawable bg(int color, int radius) {
        GradientDrawable d = new GradientDrawable(); d.setColor(color); d.setCornerRadius(dp(radius)); return d;
    }
    private TextView label(String text, int size, int color, boolean bold) {
        TextView v = new TextView(this); v.setText(text); v.setTextSize(size); v.setTextColor(color);
        if (bold) v.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        return v;
    }
    private void buildUi() {
        root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(Color.rgb(15,18,32));
        setContentView(root);
        header = new LinearLayout(this); header.setGravity(Gravity.CENTER_VERTICAL); header.setPadding(dp(18),dp(14),dp(14),dp(14));
        header.setBackgroundColor(Color.rgb(22,27,46));
        TextView brand = label("PixAI", 23, Color.WHITE, true);
        TextView sub = label("  PixCore 1 · دستیار هوشمند", 12, Color.rgb(169,180,210), false);
        LinearLayout title = new LinearLayout(this); title.setOrientation(LinearLayout.VERTICAL); title.addView(brand); title.addView(sub);
        header.addView(title, new LinearLayout.LayoutParams(0,-2,1));
        Button settings = smallButton("⚙"); settings.setOnClickListener(v -> showSettings()); header.addView(settings);
        root.addView(header);
        scroll = new ScrollView(this); scroll.setFillViewport(true);
        messages = new LinearLayout(this); messages.setOrientation(LinearLayout.VERTICAL); messages.setPadding(dp(14),dp(18),dp(14),dp(18));
        scroll.addView(messages); root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        status = label("آماده‌ام. پیام خودت رو بنویس.",12,Color.rgb(155,168,199),false);
        status.setPadding(dp(16),dp(6),dp(16),dp(6)); root.addView(status);
        LinearLayout bottom = new LinearLayout(this); bottom.setGravity(Gravity.CENTER_VERTICAL); bottom.setPadding(dp(10),dp(8),dp(10),dp(12)); bottom.setBackgroundColor(Color.rgb(22,27,46));
        composer = new EditText(this); composer.setTextColor(Color.WHITE); composer.setHintTextColor(Color.rgb(145,155,180));
        composer.setHint("پیامت رو بنویس…"); composer.setTextSize(15); composer.setSingleLine(false); composer.setMaxLines(4);
        composer.setPadding(dp(14),dp(10),dp(14),dp(10)); composer.setBackground(bg(Color.rgb(37,44,67),22));
        composer.setImeOptions(EditorInfo.IME_ACTION_SEND);
        composer.setOnEditorActionListener((v, action, event) -> { if(action==EditorInfo.IME_ACTION_SEND){sendMessage();return true;} return false;});
        bottom.addView(composer,new LinearLayout.LayoutParams(0,-2,1));
        send = new Button(this); send.setText("ارسال"); send.setTextColor(Color.WHITE); send.setAllCaps(false); send.setBackground(bg(Color.rgb(101,76,220),20));
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-2,dp(48)); bp.setMargins(dp(8),0,0,0); bottom.addView(send,bp);
        send.setOnClickListener(v -> sendMessage()); root.addView(bottom);
        addWelcome();
    }
    private Button smallButton(String text) {
        Button b = new Button(this); b.setText(text); b.setTextSize(18); b.setTextColor(Color.WHITE); b.setAllCaps(false); b.setBackground(bg(Color.rgb(45,51,75),16)); return b;
    }
    private void addWelcome() {
        if (messages.getChildCount()>0) return;
        TextView w = label("سلام! من PixCore 1 هستم.\nهر چیزی خواستی بپرس تا با هم جلو بریم.",17,Color.WHITE,true);
        w.setPadding(dp(16),dp(18),dp(16),dp(18)); w.setBackground(bg(Color.rgb(34,42,65),18));
        messages.addView(w,new LinearLayout.LayoutParams(-1,-2));
    }
    private void addBubble(String text, boolean user) {
        TextView bubble = label(text,15,user?Color.WHITE:Color.rgb(235,239,250),false);
        bubble.setTextIsSelectable(true); bubble.setPadding(dp(14),dp(12),dp(14),dp(12));
        bubble.setBackground(bg(user?Color.rgb(86,66,183):Color.rgb(35,43,65),18));
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(user?dp(300):-1,-2);
        p.gravity = user?Gravity.RIGHT:Gravity.LEFT; p.bottomMargin=dp(10);
        messages.addView(bubble,p); scroll.post(() -> scroll.fullScroll(View.FOCUS_DOWN));
    }
    private void restoreHistory() {
        try {
            JSONArray saved = new JSONArray(getPreferences(0).getString("history","[]"));
            for(int i=0;i<saved.length();i++) {
                JSONObject m=saved.getJSONObject(i); history.add(m);
                String role=m.optString("role"); if("user".equals(role)||"assistant".equals(role)) addBubble(m.optString("content"),"user".equals(role));
            }
        } catch(Exception ignored) {}
    }
    private void saveHistory() {
        JSONArray a=new JSONArray(); for(JSONObject m:history) a.put(m);
        getPreferences(0).edit().putString("history",a.toString()).apply();
    }
    private void sendMessage() {
        if(busy) return;
        String text=composer.getText().toString().trim(); if(text.isEmpty()) return;
        String token=getPreferences(0).getString("api_token","");
        if(token.isEmpty()){showSettings();return;}
        composer.setText(""); addBubble(text,true);
        try { history.add(new JSONObject().put("role","user").put("content",text)); } catch(Exception ignored) {}
        saveHistory(); busy=true; send.setEnabled(false); status.setText("PixCore در حال فکر کردنه…");
        executor.execute(() -> {
            String answer;
            try { answer=callApi(token); }
            catch(Exception e){answer="خطا در ارتباط با PixAI: "+(e.getMessage()==null?"اتصال ناموفق":e.getMessage());}
            final String result=answer;
            runOnUiThread(() -> {
                addBubble(result,false);
                try { history.add(new JSONObject().put("role","assistant").put("content",result)); } catch(Exception ignored) {}
                while(history.size()>40) history.remove(0);
                saveHistory(); busy=false; send.setEnabled(true); status.setText("آماده‌ام.");
            });
        });
    }
    private String callApi(String token) throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(API_URL+"/v1/chat/completions").openConnection();
        c.setRequestMethod("POST"); c.setConnectTimeout(20000); c.setReadTimeout(90000); c.setDoOutput(true);
        c.setRequestProperty("Content-Type","application/json"); c.setRequestProperty("Authorization","Bearer "+token);
        JSONArray msgs=new JSONArray(); msgs.put(new JSONObject().put("role","system").put("content",SYSTEM));
        int start=Math.max(0,history.size()-16); for(int i=start;i<history.size();i++) msgs.put(history.get(i));
        JSONObject body=new JSONObject().put("model","auto").put("client_id",clientId).put("reasoning_level",reasoningLevel).put("messages",msgs).put("max_tokens",1200);
        try(OutputStream out=c.getOutputStream()){out.write(body.toString().getBytes("UTF-8"));}
        int code=c.getResponseCode(); InputStream stream=code>=200&&code<300?c.getInputStream():c.getErrorStream();
        StringBuilder raw=new StringBuilder(); try(BufferedReader br=new BufferedReader(new InputStreamReader(stream,"UTF-8"))){String line;while((line=br.readLine())!=null)raw.append(line);}
        c.disconnect();
        JSONObject data=new JSONObject(raw.toString());
        if(code<200||code>=300) throw new Exception(data.optString("detail",data.optString("error","HTTP "+code)));
        JSONArray choices=data.optJSONArray("choices"); if(choices==null||choices.length()==0) throw new Exception("پاسخ معتبری از سرور دریافت نشد.");
        return choices.getJSONObject(0).getJSONObject("message").optString("content","پاسخ خالی بود.");
    }
    private void showSettings() {
        LinearLayout box=new LinearLayout(this); box.setPadding(dp(20),dp(8),dp(20),dp(4)); box.setOrientation(LinearLayout.VERTICAL);
        TextView info=label("برای اتصال امن، توکن خصوصی Worker خودت رو اینجا وارد کن. توکن داخل APK یا مخزن قرار نمی‌گیره و فقط در حافظه خصوصی همین برنامه ذخیره می‌شه.",13,Color.DKGRAY,false);
        box.addView(info);
        EditText token=new EditText(this); token.setSingleLine(true); token.setHint("API Token"); token.setInputType(129);
        token.setText(getPreferences(0).getString("api_token","")); box.addView(token);
        TextView level=label("اندازه استدلال: "+reasoningLevel,14,Color.DKGRAY,true); box.addView(level);
        SeekBar seek=new SeekBar(this); seek.setMax(2); seek.setProgress(reasoningLevel-1); box.addView(seek);
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){
            public void onProgressChanged(SeekBar b,int p,boolean u){level.setText("اندازه استدلال: "+(p+1));}
            public void onStartTrackingTouch(SeekBar b){} public void onStopTrackingTouch(SeekBar b){}
        });
        new AlertDialog.Builder(this).setTitle("تنظیمات PixAI").setView(box)
            .setPositiveButton("ذخیره", (d,w)->{
                String t=token.getText().toString().trim();
                getPreferences(0).edit().putString("api_token",t).putInt("reasoning",seek.getProgress()+1).apply();
                reasoningLevel=seek.getProgress()+1; status.setText(t.isEmpty()?"توکن تنظیم نشده":"اتصال آماده است");
                Toast.makeText(this,"تنظیمات ذخیره شد",Toast.LENGTH_SHORT).show();
            }).setNegativeButton("انصراف",null).show();
    }
    @Override protected void onDestroy(){executor.shutdownNow();super.onDestroy();}
}
