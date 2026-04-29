# Attachment Broadcast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users drag, select, preview, and broadcast supported attachments with a global prompt to every active AI webview.

**Architecture:** The React input bar converts selected files into structured IPC-safe attachment payloads. Electron main forwards the payload to active webviews. The webview preload reconstructs browser `File` objects, assigns them to site upload inputs, then injects the text prompt and sends it.

**Tech Stack:** React 19, Electron IPC, TypeScript, Vitest/jsdom.

---

### Task 1: Attachment Payloads

**Files:**
- Create: `src/attachments.ts`
- Create: `src/attachments.test.ts`
- Modify: `src/types.ts`

- [x] Write failing tests for allowed file types and size limits.
- [ ] Implement file validation and serialization.
- [ ] Run tests.

### Task 2: Webview Upload Injection

**Files:**
- Modify: `electron/webviewPrompt.cjs`
- Modify: `electron/webviewPrompt.test.ts`

- [x] Write failing tests for assigning attachments to file inputs.
- [ ] Implement upload input discovery, file reconstruction, and change/input events.
- [ ] Run tests.

### Task 3: UI and IPC Wiring

**Files:**
- Modify: `src/components/GlobalInput.tsx`
- Modify: `src/App.tsx`
- Modify: `src/electron.d.ts`
- Modify: `electron/main.cjs`
- Modify: `electron/preload.cjs`
- Modify: `electron/webview-preload.cjs`

- [ ] Add drag/drop and file picker UI.
- [ ] Include attachments in `broadcastPrompt`.
- [ ] Forward attachment payloads through main to webviews.

### Task 4: Verification

**Files:**
- Modify as needed based on verification.

- [ ] Run unit tests.
- [ ] Run lint.
- [ ] Run build.
- [ ] Rebuild macOS and Windows installers.
