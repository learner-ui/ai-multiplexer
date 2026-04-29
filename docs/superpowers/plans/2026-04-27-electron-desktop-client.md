# Electron Desktop Client Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing React + Vite AI Multiplexer UI in Electron, replace pane placeholders with persistent webviews, and broadcast global prompts into ChatGPT, Gemini, and Claude.

**Architecture:** Vite keeps serving/building the renderer. Electron owns the main process, window creation, app menu, webview enablement, and preload API. A separate webview preload script receives broadcast prompts inside each embedded AI site and delegates DOM work to provider-specific adapters.

**Tech Stack:** React 19, Vite 8, Electron, electron-builder, TypeScript, Vitest + jsdom.

---

### Task 1: Testable Webview Injection Helpers

**Files:**
- Create: `electron/webviewPrompt.ts`
- Create: `electron/webviewPrompt.test.ts`

- [ ] Write tests for provider detection and prompt injection using jsdom fixtures.
- [ ] Run the tests and verify the new behavior fails before implementation.
- [ ] Implement minimal helpers to find inputs, set text, dispatch input/change events, and trigger send.
- [ ] Re-run tests and keep them passing.

### Task 2: Electron Runtime

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `electron/webview-preload.ts`
- Create: `src/electron.d.ts`
- Modify: `package.json`
- Create: `tsconfig.electron.json`

- [ ] Add Electron dependencies and scripts for dev, build, packaging, and dist.
- [ ] Expose `broadcastPrompt`, `getWebviewPreloadPath`, `isElectron`, and `openExternal` from the renderer preload.
- [ ] Create a BrowserWindow with `webviewTag: true`, persistent sessions, secure defaults, and Vite/dev-server loading.
- [ ] Broadcast `broadcast-prompt` IPC messages from the renderer host to all attached webContents except the host.

### Task 3: Renderer Integration

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AIPane.tsx`
- Modify: `src/types.ts`

- [ ] Replace the pane placeholder with an Electron `<webview>` when the preload API is present.
- [ ] Set `partition="persist:<modelId>"` to preserve login cookies and session data by provider.
- [ ] Wire reload and external-open buttons to real webview/Electron actions.
- [ ] Replace the mock global send alert with `window.electronAPI.broadcastPrompt`.

### Task 4: Verification

**Files:**
- Modify as needed based on build feedback.

- [ ] Run unit tests.
- [ ] Run lint.
- [ ] Run renderer and Electron TypeScript builds.
- [ ] Run production packaging commands as far as the current OS/toolchain supports.
