// Dynamic Question Generator for Omer's Epic Math Game
// Curriculum: 3rd Grade Math - Israeli "Hashbacha"

// Helper to get random integer between min and max (inclusive)
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate options: 1 correct, 3 wrong but close
function generateOptions(correct, variation = 10) {
    let opts = new Set([correct]);
    
    // Sometimes we want tricky distractors (e.g., switched digits)
    if (correct > 10) {
        const str = String(correct);
        if (str.length === 2 && str[0] !== str[1]) {
            opts.add(parseInt(str[1] + str[0])); // Reverse digits
        }
    }

    while(opts.size < 4) {
        let wrong = correct + rand(-variation, variation);
        if (wrong !== correct && wrong >= 0) {
            opts.add(wrong);
        }
    }
    
    return Array.from(opts);
}

// Generate an array of N random questions for a specific level
function getRandomQuestions(level, count = 10) {
    let questions = [];
    
    for(let i=0; i<count; i++) {
        let q = {};
        
        switch(level) {
            case 1: // Decimal Structure
                let type1 = rand(1, 3);
                if (type1 === 1) {
                    let tens = rand(10, 99);
                    let val = tens * 10;
                    q = {
                        question: `כמה עשרות יש במספר ${val}?`,
                        correct: tens,
                        options: generateOptions(tens, 10),
                        hint: `זכרי, כל 10 יחידות הן עשרת אחת. הסתירי את ספרת היחידות.`
                    };
                } else if (type1 === 2) {
                    let h = rand(1, 9);
                    let t = rand(1, 9);
                    let u = rand(1, 9);
                    let val = h*100 + t*10 + u;
                    q = {
                        question: `איזה מספר שווה ל-${h} מאות, ${t} עשרות ו-${u} יחידות?`,
                        correct: val,
                        options: [val, h*100+u*10+t, t*100+h*10+u, u*100+t*10+h],
                        hint: `בני את המספר לפי המקומות: מאות, עשרות, יחידות.`
                    };
                } else {
                    let base = rand(10, 90) * 10;
                    let extra = rand(1, 9);
                    let total = base + extra;
                    q = {
                        question: `השלימי: ${base} + ___ = ${total}`,
                        correct: extra,
                        options: generateOptions(extra, 5),
                        hint: `הסתכלי על היחידות החסרות.`
                    };
                }
                break;
                
            case 2: // Addition/Subtraction hundreds/tens
                let isAdd = rand(0, 1);
                if (isAdd) {
                    let a = rand(1, 8) * 100;
                    let b = rand(1, 9 - a/100) * 100;
                    q = {
                        question: `${a} + ${b} = ?`,
                        correct: a + b,
                        options: generateOptions(a+b, 200),
                        hint: `חברי את המאות.`
                    };
                } else {
                    let a = rand(2, 9) * 100;
                    let b = rand(1, a/100 - 1) * 100;
                    q = {
                        question: `${a} - ${b} = ?`,
                        correct: a - b,
                        options: generateOptions(a-b, 200),
                        hint: `חסרי את המאות.`
                    };
                }
                break;

            case 3: // Number line & estimation
                let type3 = rand(1, 2);
                if (type3 === 1) {
                    let base3 = rand(1, 8) * 100;
                    let num3 = base3 + rand(80, 99);
                    let rounded = base3 + 100;
                    q = {
                        question: `לאיזו מאה שלמה המספר ${num3} קרוב יותר?`,
                        correct: rounded,
                        options: [rounded, base3, rounded+100, base3-100].filter(n => n >= 0),
                        hint: `הסתכלי על ספרת העשרות. האם מעגלים למעלה או למטה?`
                    };
                } else {
                    let start = rand(1, 8) * 100;
                    let step = rand(1, 5) * 10;
                    let ans = start + (step * 3);
                    q = {
                        question: `מה המספר החסר: ${start}, ${start+step}, ${start+step*2}, ___ ?`,
                        correct: ans,
                        options: generateOptions(ans, 20),
                        hint: `בדקי בכמה הקפיצה בין מספר למספר.`
                    };
                }
                break;

            case 4: // Unknowns in addition/subtraction
                let t1 = rand(20, 80);
                let t2 = rand(10, 99 - t1);
                let sum = t1 + t2;
                if (rand(0, 1)) {
                    q = {
                        question: `___ + ${t2} = ${sum}`,
                        correct: t1,
                        options: generateOptions(t1, 15),
                        hint: `השתמשי בחיסור: ${sum} פחות ${t2}.`
                    };
                } else {
                    q = {
                        question: `${sum} - ___ = ${t2}`,
                        correct: t1,
                        options: generateOptions(t1, 15),
                        hint: `כמה צריך להוריד מ-${sum} כדי להגיע ל-${t2}?`
                    };
                }
                break;

            case 5: // Vertical Addition
                let v1 = rand(100, 500);
                let v2 = rand(100, 499);
                q = {
                    question: `${v1} + ${v2} = ?`,
                    correct: v1 + v2,
                    options: generateOptions(v1+v2, 20),
                    hint: `חברי יחידות, עשרות ואז מאות.`
                };
                break;

            case 6: // Vertical Subtraction
                let s1 = rand(500, 999);
                let s2 = rand(100, s1 - 100);
                q = {
                    question: `${s1} - ${s2} = ?`,
                    correct: s1 - s2,
                    options: generateOptions(s1-s2, 20),
                    hint: `אם חסר, זכרי להלוות מהספרה הבאה!`
                };
                break;

            case 7: // Multiplication
                let m1 = rand(2, 10);
                let m2 = rand(2, 10);
                q = {
                    question: `${m1} x ${m2} = ?`,
                    correct: m1 * m2,
                    options: generateOptions(m1*m2, 10),
                    hint: `חשבי על חיבור חוזר או השתמשי בלוח הכפל.`
                };
                break;

            case 8: // Division
                let d2 = rand(2, 10);
                let d1 = rand(2, 10);
                let prod = d1 * d2;
                q = {
                    question: `${prod} / ${d2} = ?`,
                    correct: d1,
                    options: generateOptions(d1, 4),
                    hint: `איזה מספר נכפול ב-${d2} כדי לקבל ${prod}?`
                };
                break;

            case 9: // Word Problems
                let wType = rand(1, 2);
                if (wType === 1) {
                    let w1 = rand(20, 100);
                    let w2 = rand(5, w1 - 5);
                    q = {
                        question: `לעומר היו ${w1} מדבקות. היא נתנה לחברה ${w2}. כמה נשארו לה?`,
                        correct: w1 - w2,
                        options: generateOptions(w1-w2, 10),
                        hint: `תרגיל חיסור: ${w1} פחות ${w2}.`
                    };
                } else {
                    let rows = rand(3, 9);
                    let trees = rand(3, 9);
                    q = {
                        question: `בגינה יש ${rows} שורות של עצים, בכל שורה ${trees} עצים. כמה עצים יש בגינה?`,
                        correct: rows * trees,
                        options: generateOptions(rows*trees, 8),
                        hint: `תרגיל כפל: ${rows} כפול ${trees}.`
                    };
                }
                break;

            case 10: // Boss Fight
                let bType = rand(1, 3);
                if (bType === 1) {
                    let m1 = rand(2, 6);
                    let m2 = rand(2, 6);
                    let add = rand(10, 50);
                    q = {
                        question: `מלך החשבון שואל: (${m1} x ${m2}) + ${add} = ?`,
                        correct: (m1*m2) + add,
                        options: generateOptions((m1*m2)+add, 15),
                        hint: `סדר פעולות חשבון: כפל קודם!`
                    };
                } else if (bType === 2) {
                    let sub = rand(100, 900);
                    let from = 1000;
                    q = {
                        question: `מלך החשבון תוקף: ${from} - ${sub} = ?`,
                        correct: from - sub,
                        options: generateOptions(from-sub, 50),
                        hint: `סוד לפריטה מאלף: הפכי את האפסים ל-9 ואת האחרון ל-10.`
                    };
                } else {
                    let target = rand(3, 9) * 10;
                    let missing = rand(1, (target/10) - 1) * 10;
                    let start = target - missing;
                    q = {
                        question: `איזה מספר חסר למלך? ${start} + ___ = ${target}`,
                        correct: missing,
                        options: generateOptions(missing, 20),
                        hint: `כמה חסר לעשרת הבאה?`
                    };
                }
                break;
        }
        
        // Final sanity check for unique options
        q.options = Array.from(new Set(q.options));
        while(q.options.length < 4) {
            let nextVal = q.correct + rand(1, 15);
            if(!q.options.includes(nextVal)) {
                q.options.push(nextVal);
            }
        }
        
        questions.push(q);
    }
    
    return questions;
}