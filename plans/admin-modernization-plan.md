# پلن مدرن‌سازی پنل ادمین آریو شاپ

## خلاصه وظایف
- استفاده از فونت وزیر از پوشه `static/assets/fonts/vazir-font-v16.1.0`
- اعمال تغییرات جزئی در ظاهر پنل ادمین

---

## فایل‌های موجود پنل ادمین

| فایل | مسیر | توضیحات |
|------|------|---------|
| [`templates/admin/base_site.html`](templates/admin/base_site.html) | قالب اصلی ادمین | شامل لینک CSS و JS سفارشی |
| [`templates/admin/login.html`](templates/admin/login.html) | صفحه ورود | طراحی کارت ورود |
| [`static/admin/css/custom_admin.css`](static/admin/css/custom_admin.css) | استایل‌های سفارشی | تم تیره قرمز/صورتی |
| [`static/admin/js/admin_animations.js`](static/admin/js/admin_animations.js) | انیمیشن‌ها | انیمیشن‌های جاوااسکریپت |

---

## تغییرات مورد نیاز

### ۱. افزودن فونت وزیر به CSS

**فایل:** [`static/admin/css/custom_admin.css`](static/admin/css/custom_admin.css)

- افزودن `@font-face` برای فونت‌های وزیر (Regular, Bold, Medium)
- مسیر فونت: `/static/assets/fonts/vazir-font-v16.1.0/Vazir.woff2`
- به‌روزرسانی `font-family` برای استفاده از وزیر

### ۲. بهبود ظاهر (تغییرات جزئی)

- بهبود انیمیشن‌های هاور
- بهبود کنتراست متن
- بهینه‌سازی فاصله‌گذاری‌ها

---

## جزئیات فنی

### فایل‌های فونت وزیر قابل استفاده:
```
Vazir.woff2        (Regular - توصیه شده)
Vazir-Bold.woff2   (Bold)
Vazir-Medium.woff2 (Medium)
Vazir-Light.woff2  (Light)
```

### ساختار @font-face:
```css
@font-face {
    font-family: 'Vazir';
    src: url('/static/assets/fonts/vazir-font-v16.1.0/Vazir.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
```

---

## ترتیب اجرا

1. **به‌روزرسانی [`templates/admin/base_site.html`](templates/admin/base_site.html)**
   - افزودن لینک فایل فونت در بخش `extrastyle`

2. **به‌روزرسانی [`static/admin/css/custom_admin.css`](static/admin/css/custom_admin.css)**
   - افزودن @font-face برای وزیر
   - به‌روزرسانی font-family
   - اعمال بهبودهای ظاهری جزئی

3. **به‌روزرسانی [`templates/admin/login.html`](templates/admin/login.html)**
   - اطمینان از لود صحیح فونت در صفحه ورود

---

## وضعیت: در انتظار تایید
