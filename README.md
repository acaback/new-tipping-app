
# Adrian's Family Tipping Comp (Desktop Edition)

To run this app from your desktop, you need a simple local server. Browsers block modern features (like ES Modules) when opening files directly with `file://`.

## How to Launch

### Option 1: One-liner (Fastest)
Open your terminal/command prompt in this folder and run:
```bash
npx serve .
```
Then visit `http://localhost:3000`

### Option 2: Python (Built-in)
If you have Python installed, run:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`

### Option 3: VS Code (Easiest)
Install the **"Live Server"** extension, then click **"Go Live"** at the bottom of your VS Code window.

---

## Desktop Mode Features
- **LocalStorage Storage**: Your tips are saved automatically in your browser's local database.
- **Archive & Recovery**: Go to **League Ops > Archive** to download a backup of your data. This is useful if you want to switch computers or clear your browser cache.
- **Auto-Sync**: If you ever decide to host this on a WordPress site, it will automatically detect the backend and sync your data to the cloud.
