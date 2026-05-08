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
        if level == 1:
            t = rand(1, 3)
            if t == 1:
                tens = rand(10, 99)
                val = tens * 10
                q = {
                    "question": f"כמה עשרות יש במספר {val}?",
                    "correct": tens,
                    "options": generate_options(tens, 10),
                    "hint": "זכרי, כל 10 יחידות הן עשרת אחת. הסתירי את ספרת היחידות."
                }
            elif t == 2:
                h, t_val, u = rand(1, 9), rand(1, 9), rand(1, 9)
                val = h*100 + t_val*10 + u
                q = {
                    "question": f"איזה מספר שווה ל-{h} מאות, {t_val} עשרות ו-{u} יחידות?",
                    "correct": val,
                    "options": [val, h*100+u*10+t_val, t_val*100+h*10+u, u*100+t_val*10+h],
                    "hint": "בני את המספר לפי המקומות: מאות, עשרות, יחידות."
                }
            else:
                base = rand(10, 90) * 10
                extra = rand(1, 9)
                total = base + extra
                q = {
                    "question": f"השלימי: {base} + ___ = {total}",
                    "correct": extra,
                    "options": generate_options(extra, 5),
                    "hint": "הסתכלי על היחידות החסרות."
                }
        elif level == 2:
            is_add = rand(0, 1)
            if is_add:
                a = rand(1, 8) * 100
                b = rand(1, 9 - a//100) * 100
                q = {
                    "question": f"{a} + {b} = ?",
                    "correct": a + b,
                    "options": generate_options(a+b, 200),
                    "hint": "חברי את המאות."
                }
            else:
                a = rand(2, 9) * 100
                b = rand(1, a//100 - 1) * 100
                q = {
                    "question": f"{a} - {b} = ?",
                    "correct": a - b,
                    "options": generate_options(a-b, 200),
                    "hint": "חסרי את המאות."
                }
        elif level == 3:
            if rand(1, 2) == 1:
                base3 = rand(1, 8) * 100
                num3 = base3 + rand(80, 99)
                rounded = base3 + 100
                q = {
                    "question": f"לאיזו מאה שלמה המספר {num3} קרוב יותר?",
                    "correct": rounded,
                    "options": [o for o in [rounded, base3, rounded+100, base3-100] if o >= 0],
                    "hint": "הסתכלי על ספרת העשרות. האם מעגלים למעלה או למטה?"
                }
            else:
                start = rand(1, 8) * 100
                step = rand(1, 5) * 10
                ans = start + (step * 3)
                q = {
                    "question": f"מה המספר החסר: {start}, {start+step}, {start+step*2}, ___ ?",
                    "correct": ans,
                    "options": generate_options(ans, 20),
                    "hint": "בדקי בכמה הקפיצה בין מספר למספר."
                }
        elif level == 4:
            t1 = rand(20, 80)
            t2 = rand(10, 99 - t1)
            total_sum = t1 + t2
            if rand(0, 1):
                q = {
                    "question": f"___ + {t2} = {total_sum}",
                    "correct": t1,
                    "options": generate_options(t1, 15),
                    "hint": f"השתמשי בחיסור: {total_sum} פחות {t2}."
                }
            else:
                q = {
                    "question": f"{total_sum} - ___ = {t2}",
                    "correct": t1,
                    "options": generate_options(t1, 15),
                    "hint": f"כמה צריך להוריד מ-{total_sum} כדי להגיע ל-{t2}?"
                }
        elif level == 5:
            v1, v2 = rand(100, 500), rand(100, 499)
            q = {
                "question": f"{v1} + {v2} = ?",
                "correct": v1 + v2,
                "options": generate_options(v1+v2, 20),
                "hint": "חברי יחידות, עשרות ואז מאות."
            }
        elif level == 6:
            s1 = rand(500, 999)
            s2 = rand(100, s1 - 100)
            q = {
                "question": f"{s1} - {s2} = ?",
                "correct": s1 - s2,
                "options": generate_options(s1-s2, 20),
                "hint": "אם חסר, זכרי להלוות מהספרה הבאה!"
            }
        elif level == 7:
            m1, m2 = rand(2, 10), rand(2, 10)
            q = {
                "question": f"{m1} x {m2} = ?",
                "correct": m1 * m2,
                "options": generate_options(m1*m2, 10),
                "hint": "חשבי על חיבור חוזר או השתמשי בלוח הכפל."
            }
        elif level == 8:
            d2, d1 = rand(2, 10), rand(2, 10)
            prod = d1 * d2
            q = {
                "question": f"{prod} / {d2} = ?",
                "correct": d1,
                "options": generate_options(d1, 4),
                "hint": f"איזה מספר נכפול ב-{d2} כדי לקבל {prod}?"
            }
        elif level == 9:
            if rand(1, 2) == 1:
                w1 = rand(20, 100)
                w2 = rand(5, w1 - 5)
                q = {
                    "question": f"לעומר היו {w1} מדבקות. היא נתנה לחברה {w2}. כמה נשארו לה?",
                    "correct": w1 - w2,
                    "options": generate_options(w1-w2, 10),
                    "hint": f"תרגיל חיסור: {w1} פחות {w2}."
                }
            else:
                rows, trees = rand(3, 9), rand(3, 9)
                q = {
                    "question": f"בגינה יש {rows} שורות של עצים, בכל שורה {trees} עצים. כמה עצים יש בגינה?",
                    "correct": rows * trees,
                    "options": generate_options(rows*trees, 8),
                    "hint": f"תרגיל כפל: {rows} כפול {trees}."
                }
        elif level == 10:
            bType = rand(1, 3)
            if bType == 1:
                m1, m2, add = rand(2, 6), rand(2, 6), rand(10, 50)
                q = {
                    "question": f"מלך החשבון שואל: ({m1} x {m2}) + {add} = ?",
                    "correct": (m1*m2) + add,
                    "options": generate_options((m1*m2)+add, 15),
                    "hint": "סדר פעולות חשבון: כפל קודם!"
                }
            elif bType == 2:
                sub, from_val = rand(100, 900), 1000
                q = {
                    "question": f"מלך החשבון תוקף: {from_val} - {sub} = ?",
                    "correct": from_val - sub,
                    "options": generate_options(from_val-sub, 50),
                    "hint": "סוד לפריטה מאלף: הפכי את האפסים ל-9 ואת האחרון ל-10."
                }
            else:
                target = rand(3, 9) * 10
                missing = rand(1, (target//10) - 1) * 10
                start = target - missing
                q = {
                    "question": f"איזה מספר חסר למלך? {start} + ___ = {target}",
                    "correct": missing,
                    "options": generate_options(missing, 20),
                    "hint": "כמה חסר לעשרת הבאה?"
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

print("Created 10 topic JSON files.")