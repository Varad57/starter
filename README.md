# Starter — Personal Browser Launchpad & Dashboard

A lightweight, high-performance, and customizable browser start page and daily productivity launcher.

## Features

- ** Full User Customization**:
  - **Add New Blocks**: Create custom category blocks anytime.
  - **Rename Titles**: Edit and rename any category header on the fly.
  - **Edit URLs & Labels**: Modify link destinations, titles, or custom icons with live favicon resolution.
  - **Reorder & Organize**: Move blocks up or down to match your daily workflow.
  - **Delete Controls**: Clean up links or blocks you no longer need.
- **Instant Live Search**: Filter through hundreds of categorized links and blocks in real-time (Press `/` to focus).
- **Local Storage & Portability**:
  - Automatically saves all your customizations in your browser.
  - **Export to JSON** to back up your setup or take it to another device.
  - **Import from JSON** or **Reset to Defaults** at any time.
- ** Modern Dark Glassmorphic Design**:
  - Curated dark palette with translucent blur (`backdrop-filter: blur(10px)`).
  - Smooth hover micro-interactions and transitions.
  - Fully responsive across desktop, tablet, and mobile screens.
- **⚡ Zero Build Dependencies**: Pure HTML5, Vanilla CSS3, and JavaScript — fast load times with no external build tool required.

---

##  Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + E` / `Cmd + E` | Toggle **Customize Mode** |
| `/` | Focus the **Search Bar** |
| `Escape` | Clear Search and reset view |

---

## Project Structure

```
starter/
├── index.html       # Main application markup & preset links
├── styles.css       # Design tokens, glassmorphism UI & responsive styles
├── app.js           # Customization engine, search, modals & localStorage
├── README.md        # Documentation
├── works.txt        # Development backlog and tracking
└── assests/         # Local assets & icons
    ├── images/      # UI icons, preview images
    └── gifs/        # Keyboard animation assets
```

---

## Running Locally

Simply clone the repository and open `index.html` directly in your browser, or run a local HTTP server:

```bash
# Clone the repository
git clone https://github.com/Varad57/starter.git
cd starter

# Run local web server
python3 -m http.server 8000
```

Then visit **`http://localhost:8000`** in your browser.

---

## Author

Developed & maintained by **[Varad57](https://github.com/Varad57)**.
