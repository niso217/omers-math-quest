import json
import os
import subprocess
from http.server import SimpleHTTPRequestHandler, HTTPServer
import urllib.parse

PORT = 8081

HTML_PAGE = """
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>לוח בקרה ראשי - המשחק של עומר</title>
    <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Heebo', sans-serif; background: #f0f2f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { text-align: center; color: #2c3e50; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 8px; color: #34495e; }
        input[type="text"], input[type="number"], select { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        button { background: #3498db; color: white; border: none; padding: 12px 20px; font-size: 18px; border-radius: 5px; cursor: pointer; width: 100%; margin-top: 10px; }
        button:hover { background: #2980b9; }
        .deploy-btn { background: #e74c3c; margin-top: 20px; }
        .deploy-btn:hover { background: #c0392b; }
        #status { text-align: center; margin-top: 20px; font-weight: bold; color: #27ae60; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ לוח בקרה למשחק</h1>
        
        <div class="form-group">
            <label>כותרת המשחק:</label>
            <input type="text" id="gameTitle">
        </div>
        
        <div class="form-group">
            <label>שם השחקן (לשילוב בשאלות):</label>
            <input type="text" id="playerName">
        </div>
        
        <div class="form-group">
            <label>רמת קושי:</label>
            <select id="difficulty">
                <option value="easy">קל</option>
                <option value="medium">בינוני</option>
                <option value="hard">קשה</option>
            </select>
        </div>
        
        <div class="form-group">
            <label>מספר שלבים (ברירת מחדל 9):</label>
            <input type="number" id="totalLevels" max="9" min="1">
        </div>
        
        <button onclick="saveConfig()">שמור הגדרות (לוקאלי)</button>
        <button class="deploy-btn" onclick="deployGame()">🚀 צור שלבים ועדכן לאתר</button>
        
        <div id="status"></div>
    </div>

    <script>
        // Load config on startup
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                document.getElementById('gameTitle').value = data.gameTitle || '';
                document.getElementById('playerName').value = data.playerName || '';
                document.getElementById('difficulty').value = data.difficulty || 'medium';
                document.getElementById('totalLevels').value = data.totalLevels || 9;
            });

        function saveConfig() {
            const config = {
                gameTitle: document.getElementById('gameTitle').value,
                playerName: document.getElementById('playerName').value,
                difficulty: document.getElementById('difficulty').value,
                totalLevels: parseInt(document.getElementById('totalLevels').value) || 9,
                shop: { themeCost: 500, heartCost: 100 }
            };
            
            fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            })
            .then(res => res.json())
            .then(res => {
                document.getElementById('status').innerText = 'ההגדרות נשמרו בהצלחה! לא לשכוח לעדכן לאתר.';
            });
        }
        
        function deployGame() {
            document.getElementById('status').innerText = '...מייצר שאלות ומעדכן לאתר (אנא המתן)';
            fetch('/api/deploy', { method: 'POST' })
            .then(res => res.json())
            .then(res => {
                if(res.success) {
                    document.getElementById('status').innerText = '✅ האתר עודכן בהצלחה!';
                } else {
                    document.getElementById('status').innerText = '❌ שגיאה בעדכון: ' + res.error;
                }
            });
        }
    </script>
</body>
</html>
"""

class AdminHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header("Content-type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_PAGE.encode('utf-8'))
        elif self.path == '/api/config':
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            if os.path.exists('config.json'):
                with open('config.json', 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.wfile.write(b'{}')
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/config':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            with open('config.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
                
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true}')
            
        elif self.path == '/api/deploy':
            try:
                # Run the JSON generator with new config
                subprocess.run(['python3', 'generate_json.py'], check=True)
                
                # Git Push the changes to GitHub so Pages updates
                subprocess.run(['git', 'add', 'config.json', 'topic*.json'], check=True)
                subprocess.run(['git', 'commit', '-m', 'Update config and regenerate questions via Admin'], check=True)
                subprocess.run(['git', 'push'], check=True)
                
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                self.wfile.write(b'{"success": true}')
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-type", "application/json")
                self.end_headers()
                err = str(e).replace('"', "'")
                self.wfile.write(f'{{"success": false, "error": "{err}"}}'.encode('utf-8'))

if __name__ == '__main__':
    print(f"Starting Admin Dashboard on http://localhost:{PORT}")
    server = HTTPServer(('', PORT), AdminHandler)
    server.serve_forever()