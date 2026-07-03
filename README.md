# HTMLedger

**Free HTML editing for Windows — two editions, one great experience.**

HTMLedger is a desktop HTML editor for Windows built on Electron, available in two editions: **HTMLedger** (full edition, Monaco engine) and **HTMLedger Lite** (CodeMirror 6, ultralight). Both are completely free, fully offline, and collect zero telemetry.

---

## Editions

### HTMLedger (Full)
Powered by Monaco — the same editor engine that drives VS Code.

- Syntax highlighting for HTML, CSS, JS, XML, and more
- Emmet abbreviation expansion via Tab
- Multi-tab editing with unsaved-change tracking
- DMARC aggregate report viewer (reads XML locally, no uploads)
- Built-in snippet library — 16 ready-to-insert code blocks
- Find in folder — grep-style search with line numbers
- Workspace manager with card grid, search, sort, and backup
- File watcher — notifies when a file changes on disk
- Settings panel (font, tab size, autosave, minimap)
- Right-click context menu in the file sidebar
- Drag & drop files onto the editor to open them

### HTMLedger Lite
Powered by CodeMirror 6 — fast startup, small footprint.

- Syntax highlighting for 11 file types (HTML, CSS, JS, JSX, TS, TSX, JSON, XML, SVG, Markdown, plain text)
- Multi-tab editing with unsaved-change indicators
- Workspace manager — open, save, and switch projects
- File search within a workspace
- Live preview panel for HTML files
- Settings panel (font size, tab size, theme)
- Recent files on the home screen
- Drag & drop files onto the editor to open them
- Portable build available — no installer, no admin rights

---

## Download

| Edition | Installer | Installed Size |
|---|---|---|
| HTMLedger v2.0.0 | [HTMLedger.Setup.2.0.0.exe](https://github.com/localhost-314/HTMLedger/releases/download/v2.0.0/HTMLedger.Setup.2.0.0.exe) | ~150 MB |
| HTMLedger Lite v2.0.0 | [HTMLedger.Lite.Setup.2.0.0.exe](https://github.com/localhost-314/HTMLedger/releases/download/v2.0.0-lite/HTMLedger.Lite.Setup.2.0.0.exe) | ~260 MB |

**System requirements:** Windows 10 or 11 (64-bit). No additional runtimes required.

> **Windows SmartScreen warning?** This is normal for new apps without an established reputation. Click **More info → Run anyway**. The full source is right here if you'd like to review it first.

---

## Project Structure

```
HTMLedger/
├── main.js              # Electron main process (Full edition)
├── preload.js           # Preload script (Full edition)
├── renderer/            # HTML/CSS/JS renderer files (Full edition)
├── assets/              # Icons and static assets
├── HTMLedger Lite/      # Lite edition (separate Electron app)
│   ├── main.js
│   ├── preload.js
│   └── renderer/
└── Website/             # htmledger.localhost314.com (React + Vite)
    └── src/
```

---

## Building from Source

### Prerequisites
- Node.js 18+
- npm
- Windows (electron-builder targets Windows; run from an **admin terminal** to allow symlink creation)

### HTMLedger (Full)

```bash
cd HTMLedger
npm install
npm run build
# Output: dist/HTMLedger Setup 2.0.0.exe
```

### HTMLedger Lite

```bash
cd "HTMLedger Lite"
npm install
npm run build
# Output: dist/HTMLedger Lite Setup 2.0.0.exe
```

### Website

```bash
cd Website
npm install
npm run dev      # local dev server at http://localhost:5173
npm run build    # production build
```

The website is deployed automatically to [Cloudflare Pages](https://pages.cloudflare.com/) on every push to `main`.

---

## Releases

| Tag | Description |
|---|---|
| `v2.0.0` | HTMLedger Full v2.0.0 |
| `v2.0.0-lite` | HTMLedger Lite v2.0.0 |

See the [Releases page](https://github.com/localhost-314/HTMLedger/releases) for all release notes and installers.

---

## Privacy

HTMLedger and HTMLedger Lite are **fully offline**. No files are uploaded, no accounts are created, no usage data is collected, and no network requests are made during normal use. Everything runs locally on your machine.

---

## License

This project is open source under the **MIT License**.  
All dependencies (Electron, Monaco Editor, CodeMirror 6, React, Vite) are also MIT licensed.

---

## About

HTMLedger is developed by **[Localhost:314](https://localhost314.com)**, a web development company based in St. Louis, Missouri. Localhost:314 creates a range of products — from planning trips and editing HTML files to helping small businesses fulfill orders with advanced online systems.

- Website: [htmledger.localhost314.com](https://htmledger.localhost314.com)
- Company: [localhost314.com](https://localhost314.com)
- Issues & feedback: [open an issue](https://github.com/localhost-314/HTMLedger/issues)
