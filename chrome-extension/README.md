# Pajaritos Contesta - Chrome Extension

A Chrome extension that automatically replies to Facebook posts based on keyword rules. Works with all Facebook posts including groups (bypasses API limitations).

## Features

- ✅ Auto-reply to Facebook posts based on keywords
- ✅ Works with group posts (no API needed!)
- ✅ Multiple rules with different keywords and responses
- ✅ Enable/disable toggle
- ✅ Configurable delay between actions
- ✅ Simple popup interface for managing rules

## Installation

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder
5. The extension icon should appear in your toolbar

## Usage

1. Click the extension icon to open the popup
2. Toggle "Auto Reply" to enable/disable
3. Click "+ Add Rule" to create a new rule:
   - **Rule name**: A descriptive name for the rule
   - **Keywords**: Comma-separated keywords (e.g., "help, question, duda")
   - **Response**: The message to post as a comment
4. Visit Facebook and the extension will automatically reply to matching posts

## How It Works

- The extension monitors Facebook pages for new posts
- When a post matches a keyword from your rules, it:
  1. Clicks the "Comment" button
  2. Types your response
  3. Submits the comment
- It marks posts as processed to avoid duplicate replies

## Notes

- The extension works by interacting with Facebook's UI (not the API)
- It respects a delay between actions to avoid being too fast
- Posts are marked as processed to prevent duplicate replies
- Make sure you're logged into Facebook in the browser

## Icons

You'll need to add icon files:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can create simple icons or use placeholder images for now.

