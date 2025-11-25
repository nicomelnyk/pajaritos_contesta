# How to Fix the Extension Error

## The Problem
Chrome is caching an old version of the extension with invalid selectors.

## Solution: Complete Reload

### Step 1: Remove the Extension Completely
1. Go to `chrome://extensions/`
2. Find "Pajaritos de Guardia"
3. Click **"Quitar"** (Remove) button
4. Confirm removal

### Step 2: Clear Chrome Cache (Optional but Recommended)
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select "Cached images and files"
3. Click "Clear data"

### Step 3: Reload the Extension
1. In `chrome://extensions/`, click **"Cargar extensión sin empaquetar"** (Load unpacked)
2. Navigate to and select the `chrome-extension` folder
3. The extension should load with version **1.0.1**

### Step 4: Verify
1. Check that version shows **1.0.1** (not 1.0.0)
2. Click "Borrar todo" (Clear all) in Errors section
3. Refresh Facebook page
4. Open Console (F12) - you should see `[Pajaritos de Guardia] Content script loaded`

## If Errors Persist
The error `'span:contains("Comment")'` is from old cached code. The current code doesn't have this selector. Make sure you:
- ✅ Completely removed the old extension
- ✅ Reloaded from the `chrome-extension` folder
- ✅ Version shows 1.0.1
- ✅ Cleared all errors

