# PixAI Android Native

اپ بومی Android با Java است؛ رابط برنامه WebView نیست و به GitHub Pages وابستگی ندارد.

## بخش‌های Native
- PixCore 1: چت با Cloudflare Worker، تاریخچه محلی و سه سطح استدلال
- Image Studio: تولید صحنه ساخت‌یافته با PixCore، رسم با Canvas بومی Java و خروجی PNG
- Video: درخواست کلیپ شش‌ثانیه‌ای به Worker و بازکردن URL معتبر برگشتی
- PixAI Code: مسیر /v1/code/completions؛ نیازمند QWEN_API_URL و QWEN_API_KEY سمت سرور
- Search: ارسال درخواست در مسیر چت؛ وابسته به ابزار جست‌وجوی فعال Worker
- Music: مسیر /v1/music/generations، پخش MP3 و ذخیره فایل؛ نیازمند STABILITY_API_KEY سمت سرور و ممکن است هزینه داشته باشد
- Voice input: Android Speech Recognizer با زبان fa-IR
- Files: انتخاب فایل و ساخت فایل متنی با Storage Access Framework

## امنیت
توکن Worker از تنظیمات برنامه وارد و در فضای خصوصی برنامه ذخیره می‌شود. هیچ کلید API در APK یا مخزن قرار نمی‌گیرد.

## ساخت
از پوشه android دستور gradle assembleDebug اجرا شود. خروجی app/build/outputs/apk/debug/app-debug.apk است.

## محدودیت‌ها
موتور تصویر فعلی صحنه‌های دوبعدی ساخت‌یافته را رسم می‌کند و موتور فوتورئال نیست. Video، Search، Code و Music فقط در صورت فعال بودن route و پیکربندی سرویس سمت سرور کار می‌کنند. تولید ویدیو و موسیقی ممکن است هزینه سرویس داشته باشد. اندازه APK باید از منابع و امکانات واقعی حاصل شود؛ فایل بی‌استفاده برای رسیدن صوری به ۱۰ مگابایت اضافه نمی‌شود.
