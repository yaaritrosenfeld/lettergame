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
| `claude/eloquent-almeida-5494f7` | תיקון מיקום דמות במשחק הנפילה — נראית מעל רבע תחתון בכל מכשיר |

## ✅ Checklist לפני מיזוג ו-push

**בכל פעם שמתבקש "מזג ודחוף" — חובה לבצע את כל הבדיקות הבאות לפני ה-merge. אם נמצא באג — לדווח ולא להמשיך.**

### א. בדיקות קוד (Static Review)

1. **`G.trickCaller`** — כל קריאה ל-`showTrick()` מוודאת ש-`G.trickCaller` מוגדר נכון לפני הקריאה (`'fall'` / `'race'`). משחק האותיות והtrace **לא** קוראים ל-`showTrick`.

2. **State isolation** — כל `init*()` (כגון `initFall`, `initRace`) מאפסת את כל שדות ה-state הרלוונטיים. בפרט: state שנכתב בתוך `hit handler` ומשמש ב-`checkTrick` (כגון `savedPx`, `savedPy`, `savedCf`) חייב להיות מאופס ב-`init*`.

3. **Event listeners** — כל event listener שנרשם (pointer, keyboard, gyro, deviceorientation) מוסר לפני הרישום מחדש (`removeEventListener` לפני `addEventListener`). לבדוק ב-`setupFallControls`, `rcSetupControls`, `exitGame`, `exitRace`.

4. **גבולות ערכים** — velocity caps קיימים: `FG.pvx` מוגבל ל-±9. אין runaway accumulation של `cvf` ב-RG.

5. **ענף else ב-`checkTrick`** — הענף `if(G.trickCaller==='race')` מכסה את כל מקרי המירוץ. הענף `else` מטפל בנפילה. אם מתווסף משחק חדש עם שאלת הצלה — הוסף ענף מפורש, לא תסמוך על ה-else.

### ב. בדיקות בדפדפן (Runtime)

6. **אין שגיאות console** — פתח את `preview` ובדוק console (level: error). אפס שגיאות JS לפני מיזוג.

7. **זרימת שאלת הצלה — משחק נפילה**:
   - שחקן מפסיד 3 חיים → שאלה מופיעה
   - תשובה נכונה → שחקן חוזר לאותו X/Y שהיה לפני הפסילה (לא מרכז)
   - גם אחרי `exitTrick` + פתיחה מחדש — אין drift מג'ירוסקופ

8. **זרימת שאלת הצלה — משחק מירוץ**:
   - מכונית מפסידה → שאלה מופיעה
   - תשובה נכונה → מכונית חוזרת לאותה נתיב (`cf`) שהייתה לפני הפסילה
   - גם אחרי `exitTrick` + פתיחה מחדש — אין drift

9. **משחקי letters + trace לא נפגעו** — שחק משחק אותיות ומשחק כתיבה, ודא שהם עובדים כרגיל ללא שגיאות.

10. **יציאה וחזרה למשחק** — לחץ 🏠, חזור למשחק. ודא ש-state נקי (אין שיורי חיים/מיקום מהפעלה קודמת).

---

## הערות טכניות חשובות

- **TTS**: המשחק משתמש ב-Google Translate TTS API (לא רשמי) — דורש אינטרנט. fallback ל-Web Speech API אם גוגל לא זמין.
- **אווטר במשחק**: `G.photoImg` מחזיק את תמונת המשתמש כ-Image object מוטען מראש. `drawFallPlayer()` מצייר אותה בראש הדמות.
- **מיקום התחלתי במשחק נפילה**: `FG.py = Math.round(FG.H * 0.75 - FG.ph/2)` — הדמות מתחילה ב-75% מגובה הקנבס.
- **חישוב FG.H**: חייב להחסיר כותרת + game-bar + `env(safe-area-inset-bottom)`. משתנה CSS `--sai-b` חושף את הערך ל-JS. **לא להשתמש ב-`window.innerHeight` בלבד** — זה גורם לקנבס לחרוג מגבול המסך במובייל.
- **סדר אתחול**: `goScreen('s-fall')` חייב להיקרא **לפני** `initFall()` — אחרת game-bar עדיין לא מוצג ומידותיו מוחזרות כ-0.
- **קנבס בפלקסבוקס**: `#fall-canvas` צריך `min-height:0` כדי שה-flexbox יוכל לצמצם אותו מתחת לגודל ה-buffer הפנימי.
- **איפוס מיקום**: אחרי כל פגיעה — `FG.px`, `FG.py` מאופסים ל-75% גובה, `FG.walls` ו-`FG.obs` מתרוקנים.
