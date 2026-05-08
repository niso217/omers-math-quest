import json
import random

def rand(min_val, max_val):
    return random.randint(min_val, max_val)

def generate_options(correct, variation=10):
    opts = {correct}
    
    if correct > 10:
        s = str(correct)
        if len(s) == 2 and s[0] != s[1]:
            opts.add(int(s[1] + s[0]))
            
    while len(opts) < 4:
        wrong = correct + rand(-variation, variation)
        if wrong != correct and wrong >= 0:
            opts.add(wrong)
            
    lst = list(opts)
    random.shuffle(lst)
    return lst

for level in range(1, 11):
    questions = []
    for _ in range(100):
        q = {}
        
        # Level 1: המבנה העשרוני- הרכב המספר בחיבור ובכפל
        if level == 1:
            t = rand(1, 2)
            if t == 1:
                h, t_val, u = rand(1, 9), rand(1, 9), rand(1, 9)
                val = h*100 + t_val*10 + u
                q = {
                    "question": f"איזה מספר מתקבל מהתרגיל: {h}x100 + {t_val}x10 + {u}?",
                    "correct": val,
                    "options": [val, h*100+u*10+t_val, t_val*100+h*10+u, u*100+t_val*10+h],
                    "hint": "זהו הרכב המספר בכפל. חשבי מאות, עשרות ויחידות."
                }
            else:
                h, t_val, u = rand(1, 9)*100, rand(1, 9)*10, rand(1, 9)
                val = h + t_val + u
                q = {
                    "question": f"השלימי את הרכב המספר בחיבור: {h} + {t_val} + {u} = ?",
                    "correct": val,
                    "options": generate_options(val, 20),
                    "hint": "חברי את המאות, העשרות והיחידות ביחד."
                }
                
        # Level 2: תרגילי חיסור עם נעלם
        elif level == 2:
            t1 = rand(50, 500)
            t2 = rand(10, t1 - 5)
            if rand(0, 1) == 0:
                q = {
                    "question": f"{t1} - ___ = {t2}",
                    "correct": t1 - t2,
                    "options": generate_options(t1 - t2, 15),
                    "hint": f"השתמשי בחיסור: {t1} פחות {t2}."
                }
            else:
                total = t1 + t2
                q = {
                    "question": f"___ - {t2} = {t1}",
                    "correct": total,
                    "options": generate_options(total, 15),
                    "hint": f"השתמשי בפעולה ההפוכה - חיבור: {t1} ועוד {t2}."
                }
                
        # Level 3: מיקום מספר על ישר המספרים
        elif level == 3:
            t = rand(1, 2)
            if t == 1:
                base = rand(1, 8) * 100
                q = {
                    "question": f"איזה מספר נמצא בדיוק באמצע על ישר המספרים בין {base} ל-{base+100}?",
                    "correct": base + 50,
                    "options": [base+50, base+40, base+60, base+100],
                    "hint": "המספר באמצע בין מאות שלמות תמיד מסתיים ב-50."
                }
            else:
                start = rand(10, 50) * 10
                q = {
                    "question": f"על ישר המספרים יש קפיצות של 10. המספר הראשון הוא {start}. מה יהיה המספר הרביעי?",
                    "correct": start + 30,
                    "options": generate_options(start + 30, 20),
                    "hint": f"קפצי 3 קפיצות של 10 מהמספר {start}."
                }
                
        # Level 4: פתרון תרגילי חיבור וחיסור במאונך
        elif level == 4:
            if rand(0, 1) == 0:
                v1, v2 = rand(100, 500), rand(100, 499)
                q = {
                    "question": f"פתרי במאונך: {v1} + {v2}",
                    "correct": v1 + v2,
                    "options": generate_options(v1+v2, 20),
                    "hint": "רשמי את המספרים אחד מתחת לשני וחברי קודם את היחידות."
                }
            else:
                s1 = rand(500, 999)
                s2 = rand(100, s1 - 100)
                q = {
                    "question": f"פתרי במאונך: {s1} - {s2}",
                    "correct": s1 - s2,
                    "options": generate_options(s1-s2, 20),
                    "hint": "אם חסר, זכרי להלוות מהספרה השמאלית הבאה!"
                }
                
        # Level 5: פתרון תרגילי כפל במאונך
        elif level == 5:
            # 2 digits by 1 digit
            m1 = rand(11, 49)
            m2 = rand(2, 9)
            q = {
                "question": f"פתרי במאונך: {m1} x {m2}",
                "correct": m1 * m2,
                "options": generate_options(m1*m2, 20),
                "hint": f"כפלי קודם {m2} ביחידות, ואז בעשרות."
            }
            
        # Level 6: תרגול לוח הכפל
        elif level == 6:
            m1, m2 = rand(3, 10), rand(3, 10)
            q = {
                "question": f"{m1} x {m2} = ?",
                "correct": m1 * m2,
                "options": generate_options(m1*m2, 10),
                "hint": "היעזרי בלוח הכפל שאת מכירה."
            }
            
        # Level 7: תרגול פעולת החילוק ההופכית
        elif level == 7:
            d2 = rand(3, 10)
            d1 = rand(3, 10)
            prod = d1 * d2
            q = {
                "question": f"{prod} : {d2} = ?",
                "correct": d1,
                "options": generate_options(d1, 4),
                "hint": f"תחשבי על הכפל: מה כפול {d2} נותן {prod}?"
            }
            
        # Level 8: תרגילי כפל וחילוק עם נעלם
        elif level == 8:
            d2 = rand(3, 10)
            d1 = rand(3, 10)
            prod = d1 * d2
            if rand(0, 1) == 0:
                q = {
                    "question": f"___ x {d2} = {prod}",
                    "correct": d1,
                    "options": generate_options(d1, 4),
                    "hint": f"השתמשי בחילוק: {prod} לחלק ל-{d2}."
                }
            else:
                q = {
                    "question": f"{prod} : ___ = {d1}",
                    "correct": d2,
                    "options": generate_options(d2, 4),
                    "hint": f"השתמשי בחילוק ההפוך: {prod} לחלק ל-{d1}."
                }
                
        # Level 9: סיפור חשבוני / בעיה מילולית
        elif level == 9:
            wType = rand(1, 3)
            if wType == 1:
                w1 = rand(20, 100)
                w2 = rand(5, w1 - 5)
                q = {
                    "question": f"לעומר היו {w1} שקלים. היא קנתה ספר ב-{w2} שקלים. כמה עודף נשאר לה?",
                    "correct": w1 - w2,
                    "options": generate_options(w1-w2, 10),
                    "hint": f"תרגיל חיסור: {w1} פחות {w2}."
                }
            elif wType == 2:
                rows = rand(3, 9)
                trees = rand(3, 9)
                q = {
                    "question": f"באולם יש {rows} שורות של כיסאות, בכל שורה {trees} כיסאות. כמה כיסאות יש בסך הכל?",
                    "correct": rows * trees,
                    "options": generate_options(rows*trees, 8),
                    "hint": f"תרגיל כפל: {rows} כפול {trees}."
                }
            else:
                total_candies = rand(3, 9) * 4
                q = {
                    "question": f"למורה יש {total_candies} ממתקים והיא רוצה לחלק אותם שווה בשווה ל-4 ילדים. כמה יקבל כל ילד?",
                    "correct": total_candies // 4,
                    "options": generate_options(total_candies // 4, 3),
                    "hint": f"תרגיל חילוק: {total_candies} לחלק ל-4."
                }
                
        # Level 10: Boss Fight - חזרה למבדק
        elif level == 10:
            bType = rand(1, 4)
            if bType == 1:
                m1, m2 = rand(12, 30), rand(2, 5)
                q = {
                    "question": f"מלך החשבון שואל בכפל מאונך: {m1} x {m2} = ?",
                    "correct": m1 * m2,
                    "options": generate_options(m1*m2, 15),
                    "hint": "פתרי בשלבים כמו שלמדנו בכיתה."
                }
            elif bType == 2:
                sub, from_val = rand(100, 900), 1000
                q = {
                    "question": f"מלך החשבון תוקף בחיסור: {from_val} - ___ = {sub}",
                    "correct": from_val - sub,
                    "options": generate_options(from_val-sub, 50),
                    "hint": f"השלימי את הנעלם בעזרת חיסור מ-{from_val}."
                }
            elif bType == 3:
                h, t_val, u = rand(2,9), rand(2,9), rand(2,9)
                val = h*100 + t_val*10 + u
                q = {
                    "question": f"סדרי למלך את המספר: {h}x100 + {t_val}x10 + {u}",
                    "correct": val,
                    "options": generate_options(val, 20),
                    "hint": "זהו המבנה העשרוני בכפל."
                }
            else:
                d2, d1 = rand(4, 9), rand(4, 9)
                prod = d1 * d2
                q = {
                    "question": f"המלך החביא נעלם בחילוק! {prod} : ___ = {d1}",
                    "correct": d2,
                    "options": generate_options(d2, 5),
                    "hint": "היעזרי בלוח הכפל."
                }
        
        q['options'] = list(set(q['options']))
        while len(q['options']) < 4:
            nxt = q['correct'] + rand(1, 15)
            if nxt not in q['options']:
                q['options'].append(nxt)
        random.shuffle(q['options'])
        questions.append(q)

    with open(f"topic{level}.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

print("Created 10 topic JSON files tuned for the test.")