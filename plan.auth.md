# תוכנית: אבטחת נתוני שחקנים עם Firebase Auth

> מתי לממש: לפני שלב 6 (פאנל הורים)  
> קדם-תנאי: Firestore עובד, פאנל הורים מתוכנן

---

## הבעיה הנוכחית

קוד משפחה (`ארנב-8423`) = אבטחה חלשה:
- כל מי שיודע את הקוד יכול לקרוא ולכתוב נתונים
- אם מנקים localStorage — הקוד אבוד, הנתונים נעלמים
- אין דרך מאובטחת לגשת מ-2 מכשירים

---

## הפתרון — שני שלבים

### שלב א׳ — Anonymous Auth (ברקע, ללא UI)

בכניסה ראשונה Firebase יוצר `uid` אנונימי אוטומטית.  
המשתמש לא רואה שום שינוי.

```javascript
// בעת טעינת האפליקציה
firebase.auth().signInAnonymously();
firebase.auth().onAuthStateChanged(user => {
  if (user) G_uid = user.uid; // מחליף את getFamilyCode()
});
```

**Firestore rules:**
```
allow read, write: if request.auth != null
                   && request.auth.uid == resource.data.ownerId;
```

**מה זה נותן:**
- uid שמור ב-Firebase — לא ב-localStorage
- לא נמחק בניקיון cache
- עמיד ל-brute force

---

### שלב ב׳ — "שמור התקדמות" (email/password)

כפתור קטן בפאנל ההורים:  
`💾 שמור התקדמות על כל המכשירים`

```javascript
// שדרוג מ-anonymous ל-email — uid נשמר!
const credential = firebase.auth.EmailAuthProvider.credential(email, password);
firebase.auth().currentUser.linkWithCredential(credential);
```

**מה זה נותן:**
- uid זהה על כל המכשיר
- כניסה מחדש = גישה לכל הנתונים
- שחזור אם נמחק הדפדפן

---

## זרימה מלאה לאחר המימוש

```
כניסה ראשונה
    ↓
Anonymous Auth → uid אוטומטי (שקוף למשתמש)
    ↓
משחק רגיל + שמירה ב-Firestore תחת uid
    ↓
[אופציונלי] פאנל הורים → "שמור התקדמות"
    ↓
email + password → uid נשמר → cross-device מאובטח
```

---

## שינויי קוד נדרשים

| קובץ | שינוי |
|---|---|
| `index.html` | הוסף `firebase-auth-compat.js` |
| `index.html` | החלף `getFamilyCode()` ב-`G_uid` מ-auth |
| `index.html` | הוסף `signInAnonymously()` בטעינה |
| `index.html` | הוסף UI "שמור התקדמות" בפאנל הורים |
| `firestore.rules` | עדכן rules לבדוק `auth.uid == ownerId` |

**משך משוער:** 3–4 שעות

---

## מה לא צריך לשנות

- כל לוגיקת השחקנים (`loadPlayers`, `savePlayers`) — נשארת
- מבנה הנתונים ב-Firestore — נשאר
- ה-UI — אין שינוי גלוי למשתמש (חוץ מכפתור "שמור התקדמות")

---

## הערות

- Anonymous Auth חינמי לחלוטין ב-Firebase Spark plan
- `linkWithCredential` שומר את כל היסטוריית המשחק בעת השדרוג
- אין צורך ב-Google Sign-In או provider חיצוני — email/password מספיק
