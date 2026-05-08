import json
import random
import os

# Load Config
config = {
    "playerName": "עומר",
    "difficulty": "medium",
    "totalLevels": 9
}

if os.path.exists("config.json"):
    with open("config.json", "r", encoding="utf-8") as f:
        config = json.load(f)

diff_mult = 1.0
if config["difficulty"] == "easy":
    diff_mult = 0.7
elif config["difficulty"] == "hard":
    diff_mult = 1.5

def rand(min_val, max_val):
    # Apply difficulty multiplier to upper bounds for larger numbers on hard mode
    return random.randint(min_val, int(max_val * diff_mult) if max_val > 10 else max_val)

def generate_options(correct, variation=10):
    opts = {correct}
    
    if correct > 10:
        s = str(correct)
        if len(s) == 2 and s[0] != s[1]:
            opts.add(int(s[1] + s[0]))
            
    while len(opts) < 4:
        wrong = correct + random.randint(-variation, variation)
        if wrong != correct and wrong >= 0:
            opts.add(wrong)
            
    lst = list(opts)
    random.shuffle(lst)
    return lst

def ltr(math_expr):
    """Wraps a math expression in LTR span so Hebrew RTL doesn't mess it up"""
    return f'<bdi dir="ltr" style="display:inline-block;">{math_expr}</bdi>'

name = config["playerName"]

for level in range(1, config["totalLevels"] + 1):
    questions = []
    for _ in range(100):
        q = {}
        
        # Level 1: הרכב המספר בחיבור ובכפל
        if level == 1:
            t = rand(1, 2)
            if t == 1:
                h, t_val, u = rand(1, 9), rand(1, 9), rand(1, 9)
                val = h*100 + t_val*10 + u
                q = {
                    "question": f"איזה מספר מתקבל מהתרגיל: {ltr(f'{h}x100 + {t_val}x10 + {u}')}?",
                    "correct": val,
                    "options": [val, h*100+u*10+t_val, t_val*100+h*10+u, u*100+t_val*10+h],
                    "hint": "זהו הרכב המספר בכפל. חשבי מאות, עשרות ויחידות."
                }
            else:
                h, t_val, u = rand(1, 9)*100, rand(1, 9)*10, rand(1, 9)
                val = h + t_val + u
                q = {
                    "question": f"השלימי את הרכב המספר בחיבור: {ltr(f'{h} + {t_val} + {u} = ?')}",
                    "correct": val,
                    "options": generate_options(val, 20),
                    "hint": "חברי את המאות, העשרות והיחידות ביחד."
                }
                
        # Level 2: תרגילי חיסור עם נעלם
        elif level == 2:
            t1 = rand(50, 500)
            t2 = rand(10, t1 - 5)
            tType = rand(1, 3)
            if tType == 1:
                q = {
                    "question": ltr(f"{t1} - ___ = {t2}"),
                    "correct": t1 - t2,
                    "options": generate_options(t1 - t2, 15),
                    "hint": f"השתמשי בחיסור: {t1} פחות {t2}."
                }
            elif tType == 2:
                total = t1 + t2
                q = {
                    "question": ltr(f"___ - {t2} = {t1}"),
                    "correct": total,
                    "options": generate_options(total, 15),
                    "hint": f"השתמשי בפעולה ההפוכה - חיבור: {t1} ועוד {t2}."
                }
            else:
                q = {
                    "question": ltr(f"{t1} - {t2} = ___"),
                    "correct": t1 - t2,
                    "options": generate_options(t1 - t2, 15),
                    "hint": "חסרי את המספר הקטן מהגדול."
                }
                
        # Level 3: מיקום מספר על ישר המספרים
        elif level == 3:
            t = rand(1, 3)
            if t == 1:
                base = rand(1, 8) * 100
                q = {
                    "question": f"איזה מספר נמצא בדיוק באמצע על ישר המספרים בין {base} ל-{base+100}?",
                    "correct": base + 50,
                    "options": [base+50, base+40, base+60, base+100],
                    "hint": "המספר באמצע בין מאות שלמות תמיד מסתיים ב-50."
                }
            elif t == 2:
                start = rand(10, 50) * 10
                q = {
                    "question": f"על ישר המספרים יש קפיצות של 10. המספר הראשון הוא {start}. מה יהיה המספר הרביעי?",
                    "correct": start + 30,
                    "options": generate_options(start + 30, 20),
                    "hint": f"קפצי 3 קפיצות של 10 מהמספר {start}."
                }
            else:
                base3 = rand(1, 8) * 100
                num3 = base3 + rand(80, 99)
                rounded = base3 + 100
                q = {
                    "question": f"לאיזו מאה שלמה המספר {num3} קרוב יותר על ישר המספרים?",
                    "correct": rounded,
                    "options": [o for o in [rounded, base3, rounded+100, base3-100] if o >= 0],
                    "hint": "הסתכלי על ספרת העשרות. האם מעגלים למעלה או למטה?"
                }
                
        # Level 4: סיפור חשבוני
        elif level == 4:
            wType = rand(1, 3)
            if wType == 1:
                w1 = rand(20, 100)
                w2 = rand(5, w1 - 5)
                q = {
                    "question": f"ל{name} היו {w1} מדבקות. היא נתנה לחברה {w2}. כמה נשארו לה?",
                    "correct": w1 - w2,
                    "options": generate_options(w1 - w2, 10),
                    "hint": f"תרגיל חיסור: {w1} פחות {w2}."
                }
            elif wType == 2:
                w1 = rand(50, 300)
                w2 = rand(50, 300)
                q = {
                    "question": f"בקופסה ראשונה יש {w1} כדורים ובקופסה שנייה {w2} כדורים. כמה כדורים יש בשתי הקופסאות?",
                    "correct": w1 + w2,
                    "options": generate_options(w1 + w2, 20),
                    "hint": f"תרגיל חיבור: {w1} ועוד {w2}."
                }
            else:
                total = rand(100, 500)
                part = rand(30, total - 30)
                q = {
                    "question": f"בספריה יש {total} ספרים. {part} מהם הם ספרי מדע. כמה ספרים אינם ספרי מדע?",
                    "correct": total - part,
                    "options": generate_options(total - part, 15),
                    "hint": f"חסרי: {total} פחות {part}."
                }
                
        # Level 5: פתרון תרגילי חיבור, חיסור וכפל במאונך
        elif level == 5:
            opType = rand(1, 3)
            if opType == 1:
                v1, v2 = rand(100, 500), rand(100, 499)
                q = {
                    "question": f"פתרי במאונך: {ltr(f'{v1} + {v2}')}",
                    "correct": v1 + v2,
                    "options": generate_options(v1+v2, 20),
                    "hint": "רשמי את המספרים אחד מתחת לשני וחברי קודם את היחידות."
                }
            elif opType == 2:
                s1 = rand(500, 999)
                s2 = rand(100, s1 - 100)
                q = {
                    "question": f"פתרי במאונך: {ltr(f'{s1} - {s2}')}",
                    "correct": s1 - s2,
                    "options": generate_options(s1-s2, 20),
                    "hint": "אם חסר, זכרי להלוות מהספרה השמאלית הבאה!"
                }
            else:
                m1 = rand(11, 49)
                m2 = rand(2, 9)
                q = {
                    "question": f"פתרי במאונך: {ltr(f'{m1} x {m2}')}",
                    "correct": m1 * m2,
                    "options": generate_options(m1*m2, 20),
                    "hint": f"כפלי קודם {m2} ביחידות, ואז בעשרות."
                }

        # Level 6: בעיה מילולית
        elif level == 6:
            wType = rand(1, 3)
            if wType == 1:
                rows = rand(3, 9)
                seats = rand(3, 9)
                q = {
                    "question": f"באולם יש {rows} שורות של כיסאות, בכל שורה {seats} כיסאות. כמה כיסאות יש בסך הכל?",
                    "correct": rows * seats,
                    "options": generate_options(rows * seats, 8),
                    "hint": f"תרגיל כפל: {rows} כפול {seats}."
                }
            elif wType == 2:
                total_candies = rand(3, 9) * 4
                q = {
                    "question": f"למורה יש {total_candies} ממתקים והיא רוצה לחלק אותם שווה בשווה ל-4 ילדים. כמה יקבל כל ילד?",
                    "correct": total_candies // 4,
                    "options": generate_options(total_candies // 4, 3),
                    "hint": f"תרגיל חילוק: {total_candies} לחלק ל-4."
                }
            else:
                price = rand(50, 200)
                count = rand(2, 5)
                q = {
                    "question": f"{name} קנתה {count} מחברות. כל מחברת עולה {price} שקלים. כמה שילמה בסך הכל?",
                    "correct": price * count,
                    "options": generate_options(price * count, 20),
                    "hint": f"תרגיל כפל: {count} כפול {price}."
                }

        # Level 7: תרגילי כפל וחילוק עם נעלם
        elif level == 7:
            d2 = rand(3, 10)
            d1 = rand(3, 10)
            prod = d1 * d2
            tType = rand(1, 3)
            if tType == 1:
                q = {
                    "question": ltr(f"___ x {d2} = {prod}"),
                    "correct": d1,
                    "options": generate_options(d1, 4),
                    "hint": f"השתמשי בחילוק: {prod} לחלק ל-{d2}."
                }
            elif tType == 2:
                q = {
                    "question": ltr(f"{prod} : ___ = {d1}"),
                    "correct": d2,
                    "options": generate_options(d2, 4),
                    "hint": f"השתמשי בחילוק ההפוך: {prod} לחלק ל-{d1}."
                }
            else:
                q = {
                    "question": ltr(f"{d1} x ___ = {prod}"),
                    "correct": d2,
                    "options": generate_options(d2, 4),
                    "hint": f"חשבי: מה כפול {d1} שווה {prod}?"
                }
                
        # Level 8: לוח הכפל ופעולת החילוק ההופכית
        elif level == 8:
            m1, m2 = rand(3, 10), rand(3, 10)
            prod = m1 * m2
            if rand(0, 1) == 0:
                q = {
                    "question": ltr(f"{m1} x {m2} = ?"),
                    "correct": prod,
                    "options": generate_options(prod, 10),
                    "hint": "היעזרי בלוח הכפל שאת מכירה."
                }
            else:
                q = {
                    "question": ltr(f"{prod} : {m1} = ?"),
                    "correct": m2,
                    "options": generate_options(m2, 4),
                    "hint": f"חילוק הוא הפעולה ההפוכה לכפל: מה כפול {m1} נותן {prod}?"
                }
                
        # Level 9: Boss Fight
        elif level == 9:
            bType = rand(1, 5)
            if bType == 1:
                h, t_val, u = rand(2,9), rand(2,9), rand(2,9)
                val = h*100 + t_val*10 + u
                q = {
                    "question": f"מלך החשבון שואל: {ltr(f'{h}x100 + {t_val}x10 + {u} = ?')}",
                    "correct": val,
                    "options": generate_options(val, 20),
                    "hint": "זהו המבנה העשרוני בכפל."
                }
            elif bType == 2:
                m1, m2 = rand(12, 30), rand(2, 5)
                q = {
                    "question": f"מלך החשבון תוקף בכפל: {ltr(f'{m1} x {m2} = ?')}",
                    "correct": m1 * m2,
                    "options": generate_options(m1*m2, 15),
                    "hint": "פתרי בשלבים כמו שלמדנו בכיתה."
                }
            elif bType == 3:
                sub, from_val = rand(100, 900), 1000
                q = {
                    "question": f"מלך החשבון תוקף: {ltr(f'{from_val} - ___ = {sub}')}",
                    "correct": from_val - sub,
                    "options": generate_options(from_val-sub, 50),
                    "hint": f"השלימי את הנעלם בעזרת חיסור מ-{from_val}."
                }
            elif bType == 4:
                d2, d1 = rand(4, 9), rand(4, 9)
                prod = d1 * d2
                q = {
                    "question": f"המלך החביא נעלם! {ltr(f'{prod} : ___ = {d1}')}",
                    "correct": d2,
                    "options": generate_options(d2, 5),
                    "hint": "היעזרי בלוח הכפל."
                }
            else:
                rows = rand(3, 9)
                items = rand(3, 9)
                q = {
                    "question": f"מלך החשבון שואל: בארמון יש {rows} חדרים, בכל חדר {items} חיילים. כמה חיילים בסך הכל?",
                    "correct": rows * items,
                    "options": generate_options(rows*items, 8),
                    "hint": f"תרגיל כפל: {rows} כפול {items}."
                }
        
        q['options'] = list(set(q['options']))
        while len(q['options']) < 4:
            nxt = q['correct'] + random.randint(1, 15)
            if nxt not in q['options']:
                q['options'].append(nxt)
        random.shuffle(q['options'])
        questions.append(q)

    with open(f"topic{level}.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Created {config['totalLevels']} topic JSON files with '{config['difficulty']}' difficulty for player '{config['playerName']}'.")