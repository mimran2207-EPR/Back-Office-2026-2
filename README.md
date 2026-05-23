# Back-Office 2026

> ממשק ניהול בק-אופיס מודרני לעיריות — בנוי בהשראת ה-MUNI Figma של EPR Digital, עם דשבורד דינמי, ניהול פניות, תושבים, צוותים, הודעות מרוכזות, 14 מסכי הגדרות, ומערכת חיפוש AI חכמה.

## תצוגה מקדימה

פתחו את `index.html` בדפדפן. אין שלב build — הקבצים פועלים ישירות.

## תוכן הפרויקט

```
Back-Office-2026/
├── index.html              # נקודת כניסה
├── src/
│   ├── css/
│   │   ├── styles.css      # סגנונות בסיס + טוקני עיצוב
│   │   ├── polish.css      # אנימציות ואפקטים מתקדמים
│   │   └── ai.css          # פלטת AI Search
│   ├── data.jsx            # נתוני דמה (פניות, תושבים, צוותים...)
│   ├── icons.jsx           # ספריית אייקונים פנימית
│   ├── shared.jsx          # Shell — Sidebar, TopBar, PageHeader
│   ├── widgets.jsx         # ווידג'טי דשבורד (KPIs, גרפים, Top 5)
│   ├── pages.jsx           # דפים: דשבורד, פניות, תושבים, צוות, Bulk, Login
│   ├── request-detail.jsx  # עמוד פרטי פנייה עם workflow stepper
│   ├── admin-settings.jsx  # 14 מסכי הגדרות + ניהול משתמשים
│   ├── interactions.jsx    # מודאלים גלובליים (טופס חדש, דוח חדש, ישויות)
│   ├── ai-search.jsx       # ⌘K AI command palette + chatbot
│   └── app.jsx             # Router + Shell
```

## תכונות מרכזיות

### 🎯 ניהול פניות
- רשימת פניות מסוננת עם SLA tracker
- עמוד פרטי פנייה עם workflow stepper, פעולות חריגות, צ'אט פנימי
- אישור / דחייה / החזרת שלב עם דיאלוגים תואמי הקשר
- מסמכים נדרשים, היסטוריית אישורים, לוג פעילויות עם פילטרים

### 📊 דשבורד דינמי
- 4 KPIs ראשיים עם sparklines
- 6 ווידג'טים אינטראקטיביים (עמודות / דונאט / Top 5 - מתחלפים)
- טבלת פניות פעילות + עומס לפי מחלקה
- ביצועי מצטיינים + פעילות אחרונה

### ⚙️ הגדרות מערכת
14 תתי-מסכים: כללי, יומן עסקי, מבנה ארגוני, נושאי פנייה, SLA, **טפסי פנייה עם בונה טפסים + חיבור API מלא**, ערוצי כניסה, ניתוב אוטומטי, תבניות הודעה, אינטגרציות, אבטחה והרשאות, התראות, מיתוג, יומן ביקורת.

### 🔮 AI Search (⌘K)
- חיפוש מהיר על כל הישויות במערכת
- מצב AI עם chatbot המבין שפה חופשית
- מנסה להפעיל Claude אם זמין; fallback חכם
- מותאם לעברית עם תשובות מובנות + follow-up buttons

### 🎨 חוויית משתמש
- RTL מלא, פונט Heebo
- אנימציות עדינות, backdrop blur, glass effects
- סרגל צד הניתן לכיווץ (נשמר ב-localStorage)
- Breadcrumb ניווט פעיל
- Toast גלובלי לכל פעולה
- נגישות: focus rings, reduce-motion

## איך לעבוד עם הפרויקט

### העלאה ל-Git
```bash
git checkout -b Back-Office-2026
git add .
git commit -m "Back-Office 2026: initial port"
git push origin Back-Office-2026
```

### הרצה לוקאלית
פתחו `index.html` ישירות בדפדפן, או הריצו שרת סטטי:
```bash
npx serve
# או
python -m http.server 8000
```

## טכנולוגיות
- **React 18.3** + **Babel Standalone** (compile בדפדפן)
- אין שלב build
- CSS Variables לטוקני עיצוב
- אין תלויות חיצוניות פרט ל-React/Babel

## הערות לפיתוח עתידי
1. החלפת `window.eprData` ב-API אמיתי / Supabase
2. החלפת Babel-in-browser ב-Vite build
3. הוספת react-router-dom במקום hash routing
4. חיבור window.claude.complete ל-API LLM אמיתי

---

© 2026 EPR Systems — עוצב בהשראת MUNI Figma · בנוי לעיריית רעננה
