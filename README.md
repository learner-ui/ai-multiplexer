# AI Multiplexer

`AI Multiplexer` 是一个基于 `React + Vite + Electron` 的桌面客户端，用来把同一条问题同时发送给多个 AI 网页助手，并把它们放在同一个工作区里并排比较。

当前项目主要目标是做一个真正可用的多模型桌面工作台，而不是单纯的网页壳子。

## 适合做什么

- 同时向多个 AI 提问，横向对比回答
- 在一个窗口里管理多个 AI 会话
- 给支持附件的模型批量发送图片、PDF、文档
- 把常用模型固定在工作区里，减少来回切网页
- 为不同模型配置不同账号槽位和独立登录状态

## 当前能力

- Electron 桌面封装，支持持久化登录状态
- 内嵌多模型 `webview` 工作区
- 全局输入框广播文本消息
- 附件聊天文件夹
  用来保存上传到聊天里的文件，方便手动拖拽给不支持自动接收附件的模型
- 支持模型示例
  `ChatGPT`、`Gemini`、`Claude`、`DeepSeek`、`GLM`、`Copilot`、`豆包`、`Grok`
- 可增删模型面板、调整布局、保存工作区状态

## 已知说明

- 某些模型网页会频繁改版，因此自动注入输入框和附件逻辑需要持续跟进
- `Gemini` 目前更适合走“手动从聊天文件夹拖入附件”的方式，文本仍可通过全局输入框发送
- 安装包会放在 GitHub Releases 中

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm test
npm run lint
npm run build
npm run dist:mac
npm run dist:win
```

## 下载

Releases 页面：

<https://github.com/learner-ui/ai-multiplexer/releases>

## 技术栈

- `React 19`
- `TypeScript`
- `Vite`
- `Electron`
- `Vitest`

## 项目状态

这个项目目前处于持续迭代中，核心交互已经可用，模型兼容性和发布流程还在持续打磨。
