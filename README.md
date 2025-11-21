# Pajaritos Contesta - Chrome Extension

A Chrome extension that adds a "🐦 Reply" button to Facebook posts, allowing you to quickly reply to posts with a custom message.

## Features

- 🐦 Adds a "Reply" button to each main post on Facebook
- 📝 Opens a form to type your comment
- ✅ Posts comments directly to Facebook posts
- 📊 Tracks your recent comment activity

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension is now installed!

## Usage

1. Navigate to any Facebook group or page
2. You'll see a blue "🐦 Reply" button on each main post
3. Click the button to open the reply form
4. Type your comment and click "Post Comment"
5. Your comment will be posted!

## Files

- `manifest.json` - Extension configuration
- `content.js` - Main script that runs on Facebook pages
- `popup.html` / `popup.js` - Extension popup UI
- `background.js` - Background service worker
- `styles.css` - Extension styles
- `icon.svg` / `icon*.png` - Extension icons

## Development

To reload the extension after making changes:
1. Go to `chrome://extensions/`
2. Click the reload icon on the extension card
3. Refresh the Facebook page

For more detailed reload instructions, see `chrome-extension/RELOAD_INSTRUCTIONS.md`.

