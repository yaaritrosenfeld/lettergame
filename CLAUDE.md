# עולם האותיות — הוראות לשיחה

בכל שיחה חדשה קרא את הקבצים הבאים לפני כל עבודה:
- `GOALS.md` — מטרות הפרויקט, קהל היעד, עקרונות העיצוב ומצב נוכחי
- `ROADMAP.md` — תוכנית הפיתוח עם שלבים וסדר עדיפויות

## על הפרויקט

משחק לימוד עברית לגיל 5–7 בסגנון Roblox.  
קובץ יחיד: `index.html` (HTML + CSS + JS מוטמעים).

## מצב הקוד

- שפת תכנות: JavaScript vanilla, Canvas API, Web Speech API
- אין build tools, אין dependencies — עובד ישירות בדפדפן
- כל הלוגיקה ב-`index.html`

## כללי עבודה

- אל תוסיף קבצים חיצוניים (CSS/JS נפרדים) — הכל נשאר ב-`index.html`
- בדוק תמיד בתצוגה מקדימה לאחר שינויים
- commit אחרי כל שלב שהושלם
- **כל פיצ'ר או באג חייב להיפתח ב-branch חדש** לפני כל שינוי קוד

## Branches שנוצרו (מאי 2026)

| Branch | תיאור |
|---|---|
| `fix/falling-player-position` | שחקן מתחיל בתחתית, תנועה X+Y מלאה |
| `fix/reset-player-position-on-hit` | איפוס שחקן לתחתית אחרי כל פגיעה |
| `feature/avatar-in-falling-game` | אווטר מלא (תמונה, חולצה, מכנסיים) מופיע במשחק הנפילה |
| `fix/remove-avatar-options` | הסרת אפשרויות שיער וחצאית מבניית האווטר |
| `fix/hebrew-voice` | זיהוי קול עברי async |
| `fix/speak-after-cancel` | delay לפני speak למניעת race condition |
| `fix/google-tts` | החלפת Web Speech API ב-Google TTS לעברית אמינה |
| `fix/trick-question-audio-only` | הקראת שם האות בלבד, הסרת טקסט השאלה מהUI |

## הערות טכניות חשובות

- **TTS**: המשחק משתמש ב-Google Translate TTS API (לא רשמי) — דורש אינטרנט. fallback ל-Web Speech API אם גוגל לא זמין.
- **אווטר במשחק**: `G.photoImg` מחזיק את תמונת המשתמש כ-Image object מוטען מראש. `drawFallPlayer()` מצייר אותה בראש הדמות.
- **איפוס מיקום**: אחרי כל פגיעה — `FG.px`, `FG.py` מאופסים לתחתית, `FG.walls` ו-`FG.obs` מתרוקנים.
