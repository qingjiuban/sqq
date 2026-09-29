# AI Code Studio — 完整工程方案

> 一个无自有服务器、模型完全可插拔、支持自定义 API、AI Agent 本地编程、实时预览与安全沙箱的桌面 AI 编程 IDE。

---

## 1. 产品定位

AI Code Studio 不是普通的 AI 聊天 + 代码生成器，而是一个 **Model-Agnostic 的本地 AI 编程 IDE**。

核心体验：

```text
用户自然语言需求
        ↓
     AI Agent
        ↓
  理解项目 / 制定计划
        ↓
  读取、创建、修改代码
        ↓
    运行项目 / Build
        ↓
    获取错误与诊断
        ↓
      自动修复
        ↓
    本地实时预览
```

核心原则：

1. 不需要自有服务器。
2. 用户自己提供 API Key。
3. 模型不限定大厂。
4. 支持 OpenAI Compatible、Anthropic、Ollama、Custom HTTP。
5. 不支持原生 Tool Calling 的模型，也可以通过协议化文本调用工具。
6. AI 可以操作本地项目，但必须经过权限和安全策略。
7. 项目运行和预览全部优先本地完成。
8. API Key 不进入项目文件，也不经过开发者服务器。

---

# 2. 总体架构

```text
┌──────────────────────────────────────────────────────┐
│                 AI CODE STUDIO                       │
│                                                      │
│  ┌──────────────┐ ┌────────────────┐ ┌────────────┐ │
│  │   Explorer   │ │ Monaco Editor  │ │  Preview   │ │
│  │              │ │                │ │            │ │
│  │ project/     │ │ App.tsx        │ │ localhost  │ │
│  │ src/         │ │                │ │            │ │
│  │ package.json │ │                │ │            │ │
│  └──────┬───────┘ └───────┬────────┘ └─────┬──────┘ │
│         │                  │                │        │
│         └──────────────────┼────────────────┘        │
│                            ↓                         │
│                    ┌──────────────┐                  │
│                    │  AI Agent    │                  │
│                    └──────┬───────┘                  │
│                           ↓                          │
│                 ┌──────────────────┐                 │
│                 │ Model Gateway    │                 │
│                 └────────┬─────────┘                 │
│                          ↓                           │
│        ┌─────────────────┼──────────────────┐        │
│        ↓                 ↓                  ↓        │
│   OpenAI兼容        Anthropic兼容       Custom HTTP  │
│        │                 │                  │        │
└────────┼─────────────────┼──────────────────┼────────┘
         ↓                 ↓                  ↓
      任意 API          任意 API           任意 API
```

---

# 3. 技术栈

## 桌面端

- Tauri 2
- Rust

## 前端

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand

## 编辑器

- Monaco Editor

## AI

统一 Model Gateway：

- OpenAI Compatible
- Anthropic Compatible
- Ollama
- Custom HTTP
- 后续可扩展其他 Provider

## 本地项目

- 本地文件系统
- npm
- pnpm
- 后续可加入 yarn / bun

## 预览

- localhost
- WebView
- iframe
- Vite Dev Server / Preview Server

---

# 4. 项目目录

```text
ai-code-studio/
│
├── apps/
│   └── desktop/
│       │
│       ├── src/
│       │   ├── app/
│       │   │   ├── App.tsx
│       │   │   ├── router.tsx
│       │   │   └── providers.tsx
│       │   │
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── MainPanel.tsx
│       │   │   │   └── PreviewPanel.tsx
│       │   │   │
│       │   │   ├── explorer/
│       │   │   │   ├── FileTree.tsx
│       │   │   │   ├── FileItem.tsx
│       │   │   │   └── ExplorerHeader.tsx
│       │   │   │
│       │   │   ├── editor/
│       │   │   │   ├── CodeEditor.tsx
│       │   │   │   ├── EditorTabs.tsx
│       │   │   │   └── DiffViewer.tsx
│       │   │   │
│       │   │   ├── chat/
│       │   │   │   ├── ChatPanel.tsx
│       │   │   │   ├── Message.tsx
│       │   │   │   ├── ToolCall.tsx
│       │   │   │   └── AgentProgress.tsx
│       │   │   │
│       │   │   ├── preview/
│       │   │   │   ├── Preview.tsx
│       │   │   │   ├── PreviewToolbar.tsx
│       │   │   │   └── Console.tsx
│       │   │   │
│       │   │   └── settings/
│       │   │       ├── ModelSettings.tsx
│       │   │       ├── ProviderForm.tsx
│       │   │       └── SecuritySettings.tsx
│       │   │
│       │   ├── agent/
│       │   │   ├── AgentRuntime.ts
│       │   │   ├── AgentLoop.ts
│       │   │   ├── AgentContext.ts
│       │   │   ├── AgentPlanner.ts
│       │   │   ├── ToolRegistry.ts
│       │   │   └── ToolExecutor.ts
│       │   │
│       │   ├── models/
│       │   │   ├── ModelGateway.ts
│       │   │   ├── OpenAIAdapter.ts
│       │   │   ├── AnthropicAdapter.ts
│       │   │   ├── OllamaAdapter.ts
│       │   │   ├── CustomAdapter.ts
│       │   │   └── ModelRegistry.ts
│       │   │
│       │   ├── project/
│       │   │   ├── ProjectManager.ts
│       │   │   ├── FileManager.ts
│       │   │   ├── ProjectScanner.ts
│       │   │   └── ProjectContext.ts
│       │   │
│       │   ├── preview/
│       │   │   ├── PreviewManager.ts
│       │   │   ├── DevServer.ts
│       │   │   ├── PortManager.ts
│       │   │   └── PreviewBridge.ts
│       │   │
│       │   ├── security/
│       │   │   ├── PermissionManager.ts
│       │   │   ├── CommandPolicy.ts
│       │   │   ├── PathPolicy.ts
│       │   │   └── SecretManager.ts
│       │   │
│       │   ├── store/
│       │   │   ├── projectStore.ts
│       │   │   ├── agentStore.ts
│       │   │   ├── modelStore.ts
│       │   │   └── settingsStore.ts
│       │   │
│       │   ├── types/
│       │   │   ├── agent.ts
│       │   │   ├── model.ts
│       │   │   ├── project.ts
│       │   │   └── tools.ts
│       │   │
│       │   └── main.tsx
│       │
│       └── src-tauri/
│           ├── src/
│           │   ├── main.rs
│           │   ├── commands/
│           │   │   ├── filesystem.rs
│           │   │   ├── process.rs
│           │   │   ├── preview.rs
│           │   │   └── secrets.rs
│           │   ├── security/
│           │   │   ├── permissions.rs
│           │   │   ├── command_policy.rs
│           │   │   └── path_policy.rs
│           │   └── process/
│           │       ├── manager.rs
│           │       └── sandbox.rs
│           │
│           ├── capabilities/
│           │   └── default.json
│           ├── permissions/
│           │   └── project.toml
│           ├── Cargo.toml
│           └── tauri.conf.json
│
├── packages/
│   ├── agent-core/
│   ├── model-protocol/
│   ├── tool-protocol/
│   ├── project-schema/
│   └── shared-types/
│
├── templates/
│   ├── vanilla/
│   ├── react/
│   ├── vue/
│   └── vite/
│
├── docs/
│   ├── architecture.md
│   ├── agent.md
│   ├── model-api.md
│   ├── tools.md
│   └── sandbox.md
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

# 5. 核心模块

整个系统由六个核心系统组成：

```text
UI
 ↓
Project Engine
 ↓
Agent Engine
 ↓
Model Gateway
 ↓
Tool Runtime
 ↓
Preview Sandbox
```

其中最重要的是：

- Agent Engine
- Model Gateway
- Tool Runtime
- Preview Sandbox

---

# 6. Agent Engine

Agent 不应该只是：

```text
用户 → AI → 代码
```

而应该：

```text
用户
 ↓
Agent
 ↓
读取项目上下文
 ↓
制定计划
 ↓
调用模型
 ↓
模型返回 Tool Call
 ↓
Tool Runtime 执行
 ↓
结果返回模型
 ↓
继续循环
```

---

# 7. Agent Loop

核心逻辑：

```typescript
while (!finished) {
    const context = await buildContext();

    const response = await model.chat(context);

    if (response.toolCalls?.length) {
        for (const toolCall of response.toolCalls) {

            const permission =
                await permissionManager.check(toolCall);

            if (!permission.allowed) {
                await askUser();
                continue;
            }

            const result =
                await toolExecutor.execute(toolCall);

            context.add(result);
        }
    } else {
        finalAnswer = response;
        finished = true;
    }
}
```

必须设置：

```text
maxIterations = 30
```

避免 Agent 无限循环。

---

# 8. Agent Tool 协议

统一工具定义：

```typescript
interface AgentTool {
    name: string;
    description: string;
    inputSchema: JSONSchema;
    permission: ToolPermission;

    execute(input: unknown): Promise<ToolResult>;
}
```

统一 Tool Call：

```typescript
interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}
```

统一 Tool Result：

```typescript
interface ToolResult {
    toolCallId: string;
    success: boolean;
    output: unknown;

    error?: {
        code: string;
        message: string;
    };
}
```

---

# 9. 第一版 Tool 列表

```text
read_file
write_file
edit_file
delete_file

list_files
search_files

run_command
get_process_output
kill_process

start_preview
stop_preview
get_preview_url

get_project_info
get_file_tree

get_diagnostics
```

---

# 10. read_file

请求：

```json
{
    "name": "read_file",
    "arguments": {
        "path": "src/App.tsx"
    }
}
```

返回：

```json
{
    "success": true,
    "path": "src/App.tsx",
    "content": "...",
    "lines": 120
}
```

---

# 11. write_file

```json
{
    "name": "write_file",
    "arguments": {
        "path": "src/components/Header.tsx",
        "content": "..."
    }
}
```

---

# 12. edit_file

不要让模型每次重新生成整个文件。

支持：

```json
{
    "name": "edit_file",
    "arguments": {
        "path": "src/App.tsx",
        "edits": [
            {
                "old": "className=\"text-xl\"",
                "new": "className=\"text-2xl\""
            }
        ]
    }
}
```

后续可以增加：

- line range
- search/replace
- unified diff

---

# 13. search_files

```json
{
    "name": "search_files",
    "arguments": {
        "query": "ProductCard",
        "include": ["src/**/*"],
        "maxResults": 30
    }
}
```

---

# 14. run_command

禁止直接给模型一个无限制 Shell：

```text
错误：
run_command("rm -rf ...")
```

正确设计：

```json
{
    "name": "run_command",
    "arguments": {
        "command": "npm",
        "args": ["run", "build"]
    }
}
```

Command 与 args 必须拆开。

---

# 15. Command Policy

第一版允许：

```text
node
npm
pnpm
npx
git
vite
```

禁止：

```text
powershell
cmd /c
bash -c
sh -c
```

除非用户明确开启。

高风险操作需要确认：

```text
┌─────────────────────────────┐
│ AI 请求执行                  │
│                             │
│ npm install                 │
│                             │
│ 这可能下载第三方依赖         │
│                             │
│ [拒绝]       [允许一次]      │
└─────────────────────────────┘
```

---

# 16. Agent 权限等级

```text
Level 0
只读

Level 1
读取 + 创建/修改项目文件

Level 2
Level 1 + 运行安全命令

Level 3
Level 2 + 高风险命令
```

默认：

```text
Level 1
```

用户可以选择：

```text
询问所有操作
自动执行安全操作
完全自动
```

---

# 17. Model Gateway

Model Gateway 是整个“任意模型接入”的核心。

统一接口：

```typescript
interface ModelAdapter {

    id: string;

    chat(
        request: ChatRequest
    ): AsyncIterable<ModelEvent>;

    listModels?(): Promise<ModelInfo[]>;

    testConnection(): Promise<TestResult>;
}
```

---

# 18. ChatRequest

内部统一格式：

```typescript
interface ChatRequest {

    model: string;

    messages: Message[];

    tools?: ToolDefinition[];

    temperature?: number;

    maxTokens?: number;

    stream?: boolean;

    system?: string;
}
```

流程：

```text
统一 ChatRequest
       ↓
Model Adapter
       ↓
目标 API 格式
```

---

# 19. 自定义 API 配置协议

```typescript
interface ModelProviderConfig {

    id: string;

    name: string;

    type:
        | "openai-compatible"
        | "anthropic"
        | "ollama"
        | "custom-http";

    baseUrl: string;

    apiKey?: string;

    model: string;

    headers?: Record<string, string>;

    capabilities: {
        streaming: boolean;
        toolCalling: boolean;
        vision: boolean;
        reasoning: boolean;
    };

    request?: CustomRequestConfig;

    response?: CustomResponseConfig;
}
```

---

# 20. OpenAI Compatible

例如：

```json
{
    "type": "openai-compatible",
    "baseUrl": "https://example.com/v1",
    "model": "my-model",
    "apiKey": "..."
}
```

默认调用：

```text
POST /chat/completions
```

适合大量第三方 API。

---

# 21. Ollama

```json
{
    "type": "ollama",
    "baseUrl": "http://127.0.0.1:11434",
    "model": "qwen3-coder"
}
```

允许用户完全本地运行模型。

---

# 22. Custom HTTP

这是系统的最高兼容层。

示例：

```json
{
    "type": "custom-http",

    "baseUrl": "https://example.com/api/generate",

    "method": "POST",

    "headers": {
        "Authorization": "Bearer {{apiKey}}",
        "Content-Type": "application/json"
    },

    "body": {
        "model": "{{model}}",
        "prompt": "{{prompt}}",
        "temperature": "{{temperature}}"
    },

    "response": {
        "contentPath": "$.result",
        "finishReasonPath": "$.status"
    }
}
```

---

# 23. 模板变量

Custom HTTP 支持：

```text
{{apiKey}}
{{model}}
{{system}}
{{prompt}}
{{messages}}
{{temperature}}
{{maxTokens}}
{{tools}}
```

例如：

```json
{
    "model": "{{model}}",
    "messages": "{{messages}}",
    "temperature": "{{temperature}}"
}
```

---

# 24. Tool Calling 兼容层

模型分三种：

## Mode A：Native Tool Calling

模型原生支持 Function Calling。

## Mode B：JSON Tool Calling

模型输出：

```json
{
    "tool": "write_file",
    "arguments": {}
}
```

## Mode C：Text Tool Calling

模型输出：

```text
<tool_call>
{
    "name": "write_file",
    "arguments": {}
}
</tool_call>
```

统一由 Parser 转换：

```text
模型输出
 ↓
Tool Parser
 ↓
ToolCall
 ↓
Tool Executor
```

因此：

> 不支持原生 Function Calling 的模型，也可以成为 Coding Model。

---

# 25. 模型能力检测

用户点击：

```text
测试连接
```

系统测试：

```text
Chat
Streaming
Tool Calling
JSON
Vision
Reasoning
Context Length
```

结果：

```text
模型能力

Chat             ✓
Streaming        ✓
Tool Calling     ✓
JSON             ✓
Vision           ×

Coding Agent     ✓
```

---

# 26. Project Context

不要每次把整个项目发送给模型。

Project Context 保存：

```text
项目类型
技术栈
目录树
package.json
README
重要配置
最近修改文件
当前打开文件
当前错误
当前预览状态
```

---

# 27. Context 分层

```text
Layer 1
项目基本信息

Layer 2
目录结构

Layer 3
当前文件

Layer 4
相关文件

Layer 5
错误日志

Layer 6
历史修改

Layer 7
完整代码
```

Agent 根据任务动态读取。

---

# 28. 自动项目扫描

打开项目时：

```text
ProjectScanner
 ↓
检测 package.json
 ↓
检测 vite.config
 ↓
检测 tsconfig
 ↓
检测 src
 ↓
检测框架
```

第一版支持：

```text
Vanilla
React + Vite
Vue + Vite
```

后续增加：

```text
Svelte
Next.js
Nuxt
其他框架
```

---

# 29. 项目规则

项目根目录：

```text
.ai-code/
├── project.json
├── rules.md
├── context.json
└── history/
```

project.json：

```json
{
    "version": 1,
    "name": "My Project",
    "framework": "react",
    "language": "typescript",
    "packageManager": "pnpm"
}
```

---

# 30. rules.md

示例：

```markdown
# Project Rules

## 技术栈

React + TypeScript + Vite

## UI

使用 Tailwind CSS。

## 代码要求

组件必须拆分。
移动端优先。
不要修改 API 接口。

## 禁止

不要使用 jQuery。
不要引入 Bootstrap。
```

Agent 每次任务加载：

```text
System
+
rules.md
+
Project Context
+
User Request
```

---

# 31. Preview Sandbox

PreviewManager 负责：

```text
启动 Dev Server
 ↓
动态分配端口
 ↓
健康检查
 ↓
生成 Preview URL
 ↓
WebView / iframe 加载
```

例如：

```text
127.0.0.1:51873
```

默认只绑定：

```text
127.0.0.1
```

不要默认绑定：

```text
0.0.0.0
```

---

# 32. Preview 生命周期

```text
打开项目
 ↓
检测项目
 ↓
启动 Dev Server
 ↓
获取随机端口
 ↓
健康检查
 ↓
Preview Ready
 ↓
嵌入 WebView
```

---

# 33. Preview UI

```text
┌─────────────────────────────────────┐
│ ↻   Desktop  Tablet  Mobile   ⋮     │
├─────────────────────────────────────┤
│                                     │
│             网站预览                │
│                                     │
└─────────────────────────────────────┘
```

第一版：

```text
Desktop 1440×900
Tablet 768×1024
Mobile 390×844
Mobile Small 375×812
```

---

# 34. Preview 错误回传

网页错误：

```text
Uncaught TypeError:
Cannot read properties of undefined
```

自动传给 Agent：

```text
[Preview Error]

TypeError:
Cannot read properties of undefined

File:
src/components/ProductCard.tsx

Line:
38
```

Agent：

```text
读取文件
 ↓
定位错误
 ↓
edit_file
 ↓
build
 ↓
preview
```

---

# 35. Preview → AI 视觉反馈

V2 可以支持：

```text
Preview
 ↓
Screenshot
 ↓
Vision Model
 ↓
UI 问题分析
 ↓
Agent
 ↓
修改 CSS
 ↓
再次截图
```

例如：

```text
移动端按钮超出屏幕。
```

Agent 自动修复。

---

# 36. Sandbox 架构

必须区分三个层次。

## Level 1：应用权限

控制：

```text
文件访问范围
命令白名单
项目目录
API 权限
```

例如：

```text
/project/**
```

允许。

系统目录禁止。

## Level 2：Preview Sandbox

使用：

```text
127.0.0.1
随机端口
iframe sandbox
CSP
```

禁止网页直接访问：

```text
file://
Tauri 内部 API
系统文件
```

## Level 3：代码执行隔离

以后支持 Python / Go / Rust 等任意代码时，再增加：

```text
Worker Process
CPU 限制
内存限制
执行时间限制
目录限制
网络限制
```

更强隔离可以使用：

```text
Docker
Firecracker
VM
```

第一版不需要。

---

# 37. npm 安全

AI 执行：

```text
npm install
```

应该提示用户，因为依赖可能包含：

```text
preinstall
postinstall
```

建议提供：

```text
☑ 安装依赖
☐ 允许执行 package lifecycle scripts
```

默认不允许 lifecycle scripts。

---

# 38. API Key 安全

不要保存到：

```text
localStorage
project/config.json
.env
```

永久保存 API Key。

应该使用：

```text
Tauri
 ↓
OS Credential Store
```

Windows：

```text
Credential Manager
```

macOS：

```text
Keychain
```

Linux：

```text
Secret Service / Keyring
```

普通配置文件只保存：

```json
{
    "provider": "my-provider",
    "model": "xxx"
}
```

API Key 独立存储。

---

# 39. Git Checkpoint

第一版建议加入基础 Git。

每次 Agent Task：

```text
用户需求
 ↓
Git checkpoint
 ↓
AI 修改
 ↓
Build
 ↓
Preview
 ↓
用户确认
```

用户可以：

```text
接受修改
撤销修改
```

---

# 40. Diff

AI 修改后显示：

```text
AI 修改了 3 个文件

App.tsx              +12 -4
Header.tsx             +4 -1
style.css              +8 -2

[全部接受] [全部撤销]
```

编辑器支持 Monaco Diff Editor。

---

# 41. Agent 状态机

```text
IDLE
 ↓
ANALYZING
 ↓
PLANNING
 ↓
READING
 ↓
EDITING
 ↓
RUNNING
 ↓
TESTING
 ↓
FIXING
 ↓
PREVIEWING
 ↓
WAITING_USER
 ↓
DONE
```

UI 显示：

```text
● 正在分析项目
✓ 已读取 6 个文件
✓ 已修改 3 个文件
● 正在运行 npm build
● 正在检查错误
```

---

# 42. Token 管理

Context Manager：

```text
System
+
Rules
+
Project Summary
+
Relevant Files
+
Conversation
+
Tool Results
```

当达到 Token 阈值：

```text
80%
 ↓
压缩旧历史
 ↓
保留最终结果
 ↓
继续 Agent
```

避免长项目爆 Token。

---

# 43. 完整运行案例

用户：

> 帮我做一个简洁的个人主页，深色科技风。

Agent：

```text
1. 分析项目
2. 查看 package.json
3. 查看 src
4. 判断 React + Vite
```

模型：

```text
write_file
```

创建：

```text
src/components/Hero.tsx
src/components/About.tsx
src/components/Projects.tsx
```

然后：

```text
run_command
npm run build
```

如果失败：

```text
Build failed
 ↓
读取错误
 ↓
定位文件
 ↓
edit_file
 ↓
npm run build
```

成功：

```text
Build succeeded
```

然后：

```text
start_preview
```

得到：

```text
127.0.0.1:51873
```

右侧显示：

```text
LIVE
```

用户继续：

> 这个太空了，加一些卡片和动画。

Agent 继续读取当前项目并修改。

---

# 44. 第一版 MVP

第一版只做：

```text
✓ Windows 桌面端
✓ 创建项目
✓ 打开本地项目
✓ 文件树
✓ Monaco
✓ AI Chat
✓ 自定义 API
✓ OpenAI Compatible
✓ Custom HTTP
✓ Tool Calling
✓ 文件操作
✓ Terminal
✓ npm/pnpm
✓ Vite Preview
✓ iframe Preview
✓ Build Error
✓ Agent 自动修复
✓ Diff
✓ Undo
✓ API Key 安全存储
✓ 权限确认
```

第一版不做：

```text
✗ 云端同步
✗ 用户账号
✗ 在线项目
✗ GitHub 登录
✗ 多人协作
✗ 云端 Agent
✗ Docker
✗ 云数据库
✗ 插件市场
✗ 手机端
```

---

# 45. V2

```text
+ Ollama
+ 本地模型
+ Anthropic
+ Vision
+ Preview Screenshot
+ AI 看页面
+ 自动 UI 修复
+ Git
+ 多项目
+ Project Rules
+ MCP
```

---

# 46. V3

```text
+ Python
+ Node Backend
+ Docker Sandbox
+ 数据库
+ API 测试
+ 浏览器自动化
+ Playwright
+ 网站部署
+ GitHub
+ 一键发布
```

---

# 47. 核心设计原则

不要做：

```text
React
 ↓
API
 ↓
AI
 ↓
返回代码
```

这只能成为：

> AI 聊天 + 代码生成器。

正确架构：

```text
                 AI
                  │
             Agent Runtime
                  │
       ┌──────────┼──────────┐
       ↓          ↓          ↓
    Files      Terminal    Preview
       │          │          │
       └──────────┼──────────┘
                  ↓
             Project State
```

模型只是“大脑”。

Tool Runtime 是“手”。

Project State 是“记忆”。

Preview 是“眼睛”。

---

# 48. 最终架构

```text
                 ┌──────────────┐
                 │     模型      │
                 │    Brain     │
                 └──────┬───────┘
                        │
                        ↓
                 ┌──────────────┐
                 │ Agent Engine │
                 └──────┬───────┘
                        │
             ┌──────────┼──────────┐
             ↓          ↓          ↓
         File Tool   Shell Tool  Preview
             │          │          │
             ↓          ↓          ↓
          文件系统    本地程序     网页
             │          │          │
             └──────────┼──────────┘
                        ↓
                    Project
```

Model Gateway：

```text
             Agent
               │
         Model Gateway
               │
    ┌──────────┼──────────┐
    ↓          ↓          ↓
OpenAI      Ollama      Custom
    │          │          │
    └──────────┼──────────┘
               ↓
           任意模型
```

---

# 49. 无服务器部署模型

整个第一版：

```text
用户电脑
│
├── AI Code Studio
│
├── 本地项目
│
├── 本地 Node/npm/pnpm
│
├── 本地 Preview
│
├── API Key
│
└──────────────→ 用户指定的 AI API
```

开发者服务器：

```text
0
```

开发者数据库：

```text
0
```

用户项目上传：

```text
0
```

---

# 50. 推荐开发顺序

不要一次生成全部工程。

## Phase 0：桌面壳

完成：

```text
Tauri
React
TypeScript
Monaco
```

目标：

```text
能够打开项目
显示文件树
编辑代码
保存文件
```

## Phase 1：Model Gateway

完成：

```text
OpenAI Compatible
Custom HTTP
API Key Storage
Streaming
模型测试
```

目标：

```text
用户输入：
你好

模型正常返回。
```

## Phase 2：Agent

完成：

```text
read_file
write_file
edit_file
list_files
search_files
```

目标：

```text
用户：
创建一个网页。

AI：
自动创建文件。
```

## Phase 3：Terminal

完成：

```text
run_command
get_process_output
kill_process
```

加入：

```text
Command Policy
Permission Dialog
```

## Phase 4：Preview

完成：

```text
Dev Server
Port Manager
Preview WebView
Console
Error Capture
```

目标：

```text
AI 创建网页
 ↓
自动启动
 ↓
右侧出现网页
```

## Phase 5：Agent 自修复

完成：

```text
Build
 ↓
Error
 ↓
Agent
 ↓
Fix
 ↓
Build
 ↓
Success
```

## Phase 6：安全与 Git

完成：

```text
OS Keychain
Git Checkpoint
Diff
Rollback
Permission
Sandbox
```

---

# 51. MVP 验收标准

第一版不能只看“能不能聊天”。

必须通过以下测试：

### 测试 1：创建项目

用户：

```text
创建一个 React + Vite 项目。
```

结果：

```text
项目创建成功
```

### 测试 2：创建网页

用户：

```text
做一个深色科技风个人主页。
```

结果：

```text
自动创建多个文件
自动运行
右侧出现预览
```

### 测试 3：修改

用户：

```text
把按钮变成红色。
```

结果：

```text
只修改相关代码
Diff 正确
Preview 更新
```

### 测试 4：自动修复

人为制造：

```text
TypeScript Error
```

结果：

```text
AI 能看到错误
AI 能定位文件
AI 能修改
Build 成功
```

### 测试 5：自定义模型

输入：

```text
Base URL
API Key
Model
```

结果：

```text
测试成功
模型可以完成 Agent Task
```

### 测试 6：无 Tool Calling 模型

模型只支持普通文本。

结果：

```text
通过 Text Tool Calling
完成 read_file / edit_file
```

### 测试 7：本地模型

Ollama：

```text
127.0.0.1:11434
```

结果：

```text
可以完成基础 Coding Task
```

### 测试 8：危险命令

AI 请求：

```text
删除项目之外的文件
```

结果：

```text
必须阻止
```

---

# 52. 最终产品体验

用户打开软件：

```text
┌──────────────────────────────────────────────────────┐
│ AI Code Studio                         ● API Connected│
├──────────┬──────────────────────┬───────────────────┤
│          │                      │                   │
│ PROJECT  │       EDITOR         │      PREVIEW      │
│          │                      │                   │
│ src/     │  App.tsx             │   ┌───────────┐   │
│ ├─App    │                      │   │           │   │
│ ├─main   │  export default...   │   │   WEBSITE │   │
│ └─style  │                      │   │           │   │
│          │                      │   └───────────┘   │
│ package  │                      │                   │
│          │                      │                   │
├──────────┴──────────────────────┴───────────────────┤
│ AI Agent                                             │
│                                                      │
│ 你：帮我把首页改成科技感，并增加三个产品卡片。       │
│                                                      │
│ ✓ 已分析项目                                         │
│ ✓ 已读取 App.tsx                                    │
│ ✓ 已创建 ProductCard.tsx                            │
│ ✓ 已修改首页                                         │
│ ● 正在运行 npm run build                             │
│                                                      │
│ ┌───────────────────────────────────────────────┐    │
│ │ 告诉 AI 你想做什么……                         │    │
│ └───────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

这就是第一版应该达到的产品形态。

---

# 53. 一句话总结

最终产品架构：

```text
Tauri
+
React
+
Monaco
+
Agent Engine
+
Model Gateway
+
Tool Runtime
+
Local Project
+
Preview Sandbox
```

其中：

```text
服务器 = 不需要

模型 = 用户自己提供

API = 用户自己配置

项目 = 用户本地

代码 = 用户本地

Agent = 本地运行

预览 = 本地运行

API Key = 本机安全存储
```

最终目标不是：

> “让 AI 给我写一段代码。”

而是：

> **“我告诉 AI 我要什么，它直接在我的电脑里把项目做出来，并且让我实时看到结果。”**
