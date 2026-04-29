# Backend & Electron Integration Handoff

This document explains how to take the React UI prototype and turn it into a fully functioning desktop application (e.g., using Electron).

## UI Architecture Overview

The UI is built with React and Tailwind CSS. It features a flexible layout designed to host multiple AI chat interfaces simultaneously.

- **`App.tsx`**: Manages the global state (which AI models are currently active).
- **`Workspace.tsx`**: A horizontal flex container that renders the active AI panes side-by-side.
- **`AIPane.tsx`**: Currently contains a placeholder for the `webview`.
- **`GlobalInput.tsx`**: The unified bottom input bar. When submitted, it calls `handleGlobalSend` in `App.tsx`.

## Steps for Electron Integration

To make this a real working app that embeds ChatGPT, Gemini, and Claude, you should wrap this React app in an Electron shell.

### 1. Enable Webviews
In your Electron `main.js` (or `main.ts`), ensure that webview tags are enabled when creating the `BrowserWindow`:

```javascript
const mainWindow = new BrowserWindow({
  webPreferences: {
    webviewTag: true, // Required for <webview>
    preload: path.join(__dirname, 'preload.js')
  }
});
```

### 2. Replace Placeholders in `AIPane.tsx`
In `src/components/AIPane.tsx`, replace the `.flex-1.bg-gray-50` placeholder `div` with an actual Electron `<webview>` tag.

```jsx
{/* In Electron, replace the placeholder div with this: */}
<webview 
  src={model.url} 
  className="flex-1 w-full h-full"
  partition={`persist:${model.id}`} // Ensures distinct sessions/cookies if needed, or share them.
  preload={`file://${window.electronApi.getPreloadPath()}`} // Inject your DOM manipulation script
/>
```
*(Note: You will need to expose a method via `contextBridge` in your main preload script to give the React app the correct path to the webview preload script).*

### 3. The Injection Strategy (Preload Scripts)
Because each AI site (ChatGPT, Gemini, Claude) has a different DOM structure, you need a "webview preload script" that gets injected into each site.

This script should:
1. Listen for IPC messages from the React host (e.g., `ipcRenderer.on('global-prompt', ...)`).
2. Use DOM selectors to find the specific input textarea on that site.
3. Set the value of the textarea.
4. Simulate an "Enter" keypress or click the site's specific "Send" button.

### 4. Wiring the Global Input to Webviews
When the user types in the `GlobalInput.tsx` and clicks Send, the React `App.tsx` receives the text.

You should update `handleGlobalSend` in `App.tsx` to send an IPC message to the Electron main process, which then broadcasts it to all active `<webview>` elements.

```javascript
// In App.tsx
const handleGlobalSend = (message: string) => {
  // Assuming window.electronAPI is exposed via main preload
  window.electronAPI.broadcastPrompt(message);
};
```

Then in Electron Main Process:
```javascript
ipcMain.on('broadcast-prompt', (event, text) => {
  const webviews = mainWindow.webContents.getAllWebContents(); // or track them specifically
  webviews.forEach(wc => {
    if (wc !== mainWindow.webContents) {
       wc.send('inject-prompt', text);
    }
  });
});
```

## Summary for the Next Developer
1. Wrap this Vite project in an Electron boilerplate (like `electron-vite`).
2. Swap the mock UI in `AIPane.tsx` for `<webview>` tags.
3. Write custom CSS selectors in the webview preload scripts to handle the text injection and send-button clicking for `chatgpt.com`, `gemini.google.com`, and `claude.ai`.