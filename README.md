# bytab

bytab 包含两个独立应用：Chrome 新标签页扩展和官方介绍网站。官网 Phase 1 基于 `_docs/design/ext_home/code.html` 实现沉浸式首页、功能 Dock、URL 驱动的 macOS 白板弹窗及各路由的 SSR SEO。

## Project Structure

```text
bytab/
├── .vscode/
│   └── extensions.json
├── apps/
│   ├── extension/
│   │   ├── assets/styles/main.css
│   │   ├── components/
│   │   ├── composables/
│   │   ├── entrypoints/newtab/
│   │   │   ├── index.html
│   │   │   ├── main.ts
│   │   │   └── App.vue
│   │   ├── public/
│   │   ├── utils/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── wxt.config.ts
│   └── web/
│       ├── app/
│       │   ├── assets/css/main.css
│       │   ├── components/
│       │   ├── composables/useSiteSeo.ts
│       │   ├── layouts/default.vue
│       │   ├── pages/index.vue
│       │   ├── pages/features/[slug].vue
│       │   ├── pages/privacy.vue
│       │   └── app.vue
│       ├── server/routes/
│       ├── shared/site.ts
│       ├── scripts/verify-ssr.mjs
│       ├── .env.example
│       ├── nuxt.config.ts
│       ├── package.json
│       └── tsconfig.json
├── .gitignore
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

- `apps/extension`：WXT Chrome Extension，包名为 `@bytab/extension`。源自 [WXT 官方 Vue Starter](https://wxt.dev/guide/installation.html)。
- `apps/web`：Nuxt 4 Official Website，包名为 `@bytab/web`。源自官方 `create-nuxt` 的 minimal 模板，使用 Nuxt 4 的 `app/` 目录约定。
- 根目录：仅管理 Workspace、统一 lockfile、命令转发和工程文档。各应用声明和管理自己的依赖。

保留扩展原有空目录中的 `.gitkeep`。Nuxt 组件目录在实际需要组件时再创建。当前没有共享业务逻辑，因此不创建共享 Package。

## Tech Stack

- pnpm Workspace，单一 `pnpm-lock.yaml`，不引入额外 Monorepo 工具。
- Extension：WXT 0.21.5、Vue 3、TypeScript、Chrome Manifest V3、原生 CSS。
- Web：Nuxt 4、Vue 3、TypeScript、Nuxt 原生 CSS。

## Development

Node.js 版本需满足 Nuxt 4 的要求：`^22.22.3 || ^24.15.0 || >=26.0.0`，本项目在 Node.js 24.19.0 上验证。pnpm 版本由根目录 `packageManager` 固定为 `12.11.2`；可使用支持该字段的包管理器启动器，或安装对应版本的 pnpm。

所有命令均从仓库根目录执行：

| 命令 | 用途 |
| --- | --- |
| `pnpm install` | 为整个 Workspace 安装依赖，并运行 WXT / Nuxt 的 `postinstall` 类型准备 |
| `pnpm dev:ext` | 启动扩展开发服务，默认使用 3000 端口并尝试打开 Chrome |
| `pnpm dev:web` | 启动官网开发服务，默认使用 3001 端口 |
| `pnpm build:ext` | 独立构建 Chrome 扩展 |
| `pnpm build:web` | 独立构建 Nuxt 官网 |
| `pnpm zip:ext` | 构建并生成 Chrome 扩展 ZIP |
| `pnpm typecheck` | 分别运行两个应用的 TypeScript 检查 |

也可单独检查应用：

```sh
pnpm --filter ./apps/extension typecheck
pnpm --filter ./apps/web typecheck
```

根脚本使用目录选择器，不依赖产品名或 Package 名。两个应用之间没有构建依赖，也不要求彼此的开发服务器运行。

### 官网 Phase 1

官网使用 Nuxt 4 原生文件路由和 SSR。`app/layouts/default.vue` 持续挂载首页 Shell、Prompt Bar、Dock 和公共窗口，`useRoute()` 决定弹窗、标题及 Dock Active 状态，没有第二套弹窗开关。关闭使用 `navigateTo('/', { replace: true })`；Escape、遮罩、红色控制点和 Close 均可关闭。窗口的键盘焦点范围包含 Dock，支持 Tab 循环及关闭后的焦点恢复。

| 页面 | URL |
| --- | --- |
| Homepage | `/` |
| Bookmarks | `/features/chrome-bookmarks` |
| Dock | `/features/bookmark-dock` |
| Search | `/features/search-launcher` |
| Appearance | `/features/customize-new-tab` |
| Privacy | `/privacy` |

路由、图标、名称及 SEO 文案集中在 `apps/web/shared/site.ts`。未知功能 slug 返回 404。功能页面目前只输出白色 `.feature-whiteboard`，后续在这些 Vue 页面中增加语义化内容即可继续由服务端渲染。`FeatureModal` 提供公共外观，不需要复制首页。

官网直接复用扩展中不依赖 Chrome API 的 `PromptBar.vue`、`HomeIcon.vue`、本地字体和玻璃样式；背景直接引用 `apps/shared/wallpapers/default.png`，保留设计稿中的 cover 定位、白色叠层及渐变。官网不导入扩展页面或 Chrome API，不读取书签。Prompt 输入与模型选择只保存在当前页面内存中，提交按钮禁用，不发送请求。

在 `apps/web/.env` 中配置 `.env.example` 所列的可选项：

- `NUXT_PUBLIC_SITE_URL`：确定后的生产站点 origin。未配置时，SSR canonical、OG URL、`/sitemap.xml` 和 `/robots.txt` 使用实际请求 origin；未填造生产域名。每个功能的 canonical 指向自己的路径。
- `NUXT_PUBLIC_CHROME_WEB_STORE_URL`：真实 Chrome Web Store 链接。为空时，Add to Chrome 按钮保留未接入状态。

每页通过 `useSeoMeta` 输出独立 title、description、OG 和 Twitter Card；canonical 使用 `useHead` 输出。`/sitemap.xml` 包含首页及五个功能页面，无额外 SEO 依赖。部署使用默认 SSR 服务端构建，需将全部请求交给 Nuxt/Nitro，以支持功能页直接打开和刷新。

启动官网后可运行 `pnpm --filter ./apps/web verify:ssr` 检查六个页面的 HTTP、服务端元数据、canonical、可抓取链接、空白弹窗、静态资源、404、sitemap 和 robots。可用 `BYTAB_TEST_BASE_URL` 指定其他本地预览端口。若服务端设置了 `NUXT_PUBLIC_SITE_URL`，检查命令也需使用相同值。项目目前未配置 lint 脚本。

### 构建产物

- 扩展生产目录：`apps/extension/dist/chrome-mv3/`。
- 扩展开发目录：`apps/extension/dist/chrome-mv3-dev/`。
- 扩展 ZIP：`apps/extension/dist/bytabextension-0.0.1-chrome.zip`，名称由 WXT 根据 Package 名和扩展版本自动生成。
- 官网生产目录：`apps/web/.output/`。当前使用 Nuxt 默认生产构建，可通过 `pnpm --filter ./apps/web preview` 本地预览。

`node_modules/`、WXT 的 `.wxt/`、Nuxt 的 `.nuxt/`、扩展 `dist/` 和官网 `.output/` 均为生成文件，不能提交。环境变量、本地浏览器配置和 Cloudflare `.wrangler/` 也由根 `.gitignore` 排除。

### 在 Chrome 中验证扩展

1. 执行 `pnpm build:ext`。
2. 打开 `chrome://extensions/`，开启「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择 `apps/extension/dist/chrome-mv3/`。
4. 新建标签页；如 Chrome 提示确认更改新标签页，选择保留更改。
5. 确认浅色背景中央显示 `bytab.` 和 `Your bookmarks, beautifully organized.`。

开发时也可以手动加载 `apps/extension/dist/chrome-mv3-dev/`，并保持 `pnpm dev:ext` 运行。如 Chrome 安装路径无法识别，可按 [WXT 浏览器启动配置](https://wxt.dev/guide/essentials/config/browser-startup.html) 在 `apps/extension/web-ext.config.ts` 中设置本机路径；此文件不提交。

扩展通过 `apps/extension/entrypoints/newtab/index.html` 使用 WXT 原生 New Tab 入口，WXT 自动生成 `chrome_url_overrides.newtab`。扩展名称、版本、Chrome 目标、Manifest V3 和权限集中在 `apps/extension/wxt.config.ts`，不手工维护独立的 `manifest.json`。生产权限仅为 `bookmarks`；WXT 开发模式可能自动添加热更新所需权限。

## Deployment

- Extension：未来通过 Chrome Web Store 分发，使用扩展自己的生产构建和 ZIP。
- Web：未来计划部署到 Cloudflare Workers。部署配置届时放在 `apps/web`，当前保留 Nuxt 默认构建方式，不配置 Cloudflare 资源。

两个应用独立发布。本轮不部署官网，也不发布扩展；生产域名和商店链接通过运行时配置接入。

## Reuse for Another Product

当前仓库的目录和脚本可作为未来 GitHub Template Repository 的基础。本轮不创建独立模板仓库，也不加入模板生成器。

1. 修改根 `package.json` 的仓库名称，以及两个应用的 Package 名，例如 `@product/extension` 和 `@product/web`。保留 `private: true`；根命令按目录转发，无需随 Package 名修改。
2. 在 `apps/extension/package.json` 更新版本和描述；在 `apps/extension/wxt.config.ts` 更新扩展名称、描述、版本及实际需要的最小权限。两处版本保持一致。
3. 在 `apps/extension/entrypoints/` 替换产品相关入口内容，并更新本应用的组件、样式和公共资源。保留 WXT 入口约定、`postinstall: wxt prepare` 和继承 `.wxt/tsconfig.json` 的配置；Manifest 继续由 WXT 生成。
4. 在 `apps/web/shared/site.ts` 修改路由和 SEO 文案，在 `app/components/`、`app/assets/css/` 中替换官网品牌文字、样式和资源；语言及运行时配置在 `nuxt.config.ts`。确定域名和商店地址后设置 `.env.example` 所列配置；网站部署设置仍放在本应用内。
5. 更新本 README 的产品说明和扩展产物名称。从根运行 `pnpm install` 更新单一 lockfile，再执行 `pnpm typecheck`、`pnpm build:ext`、`pnpm build:web` 和 `pnpm zip:ext`，独立验证两个应用。

通用工程配置保持在根目录，Chrome API 逻辑只属于扩展，官网品牌和 SEO 只属于 Web。只有出现实际共享的设计 Token、TypeScript 类型或工具函数后，才单独建立共享 Package。

官网本轮只实现视觉和路由交互，功能弹窗仍为白板；真实搜索、书签管理、个性化设置及完整隐私正文留待后续开发。

### 扩展 Prompt Bar V1

扩展首页使用 `ExtensionPromptBar.vue`，官网继续使用原有 `PromptBar.vue` 预览，不加载 Chrome 书签或设置。输入框尺寸保持不变，支持粘贴多行内容及 Shift+Enter 换行。

- `utils/promptProviders.ts`：维护 Provider 名称、图标、分组、启用状态和可信 URL。ChatGPT 使用 `?prompt=`，Claude 使用 `/new?q=`，Grok 使用 `?q=`，Google/Bing 使用 `/search?q=`；统一 trim 后 encodeURIComponent。Gemini 显示 Coming Soon 且禁用。
- `composables/usePromptProvider.ts`、`utils/storage.ts`：复用本地存储机制，保存 `bytab.promptProvider`，恢复并同步跨标签页选择，缺失或无效值回退 ChatGPT。
- `composables/usePromptNavigation.ts`：复用 `openWebsite` 在新标签页打开 URL；最近打开仅保存 Provider 首页，不保存 Prompt、查询 URL，也不写剪贴板。
- `utils/promptBookmarks.ts`：复用 `useBookmarks` 已有 `catalog.searchIndex`，按标题完全匹配、标题前缀、标题包含、URL 包含排序，同级保持 Chrome 原顺序；最多六条，只接受 HTTP/HTTPS。
- `components/home/ExtensionPromptBar.vue`、`PromptProviderIcon.vue`：扩展专用菜单、图标、候选浮层及交互。`pages/HomePage.vue` 传入现有索引，未增加书签读取实例。

书签候选默认索引为 -1。直接 Enter 和蓝色按钮执行 Provider；上下键主动选中后，只有键盘 Enter 打开书签。Hover 不改选中索引。Esc 关闭候选但保留文字；输入、Provider 或书签数据变化清除选中状态。IME 组合期间和确认事件不触发跳转；按住 Enter 不重复打开标签页。无匹配或空输入不显示候选。候选和 Provider 菜单在小窗口内滚动，不改变 Dock、快捷方式或背景几何布局。

验证命令（扩展目录）：

```bash
pnpm compile
pnpm test
pnpm build
pnpm test:prompt:browser
pnpm test:browser
```

浏览器测试复用可用的 Playwright，可通过 `BYTAB_PLAYWRIGHT_MODULE` 指定模块路径，通过 `BYTAB_CHROMIUM_EXECUTABLE` 指定支持加载扩展的 Chromium/Chrome for Testing。项目没有配置 Lint 脚本。

`tests/prompt.test.mjs` 验证 Provider 白名单、编码和搜索排序。`tests/prompt.browser.mjs` 使用独立临时浏览器资料和真实 Chrome 书签 API，覆盖八个关键键盘场景、点击、跨标签页持久化、数据更新、危险协议、响应式布局。它捕获 `chrome.tabs.create` 的真实参数并创建空白标签页，阻止测试文本发往第三方；因此验证的是扩展提交的 URL，不代表 AI 网站已成功预填或 Google/Bing 已渲染结果。IME 验证为组合事件模拟，仍需真实中文输入法验收。第三方登录跳转、风控、URL 参数支持及最终发送行为由目标网站决定；bytab 不注入脚本、不点击发送、不调用 API，权限保持 `bookmarks`、`storage`、`sessions`。

测试结果及截图输出在 `apps/extension/.output/prompt-verification` 和 `apps/extension/.output/bookmark-verification`。重新构建后的加载目录为 `apps/extension/dist/chrome-mv3`。

### 快捷方式栏与单层文件夹

扩展的 Frequent Shortcuts 标题左侧提供拖动手柄，可整体移动；聚焦手柄后也可用方向键微调。Pin 固定整栏位置，Unpin 解锁；位置与固定状态保存到 `bytab.shortcutBar`，刷新、新标签页和窗口尺寸变化后仍可恢复，Reset layout 可返回默认布局。

主栏的 New folder 创建文件夹；文件夹内只接受快捷方式，不提供新建子文件夹入口。链接可拖到主栏文件夹上，或通过编辑弹窗的 Folder 下拉移入／移出。文件夹可以改名，删除文件夹会把内部链接移回主栏。旧的快捷方式及其独立拖动位置保持兼容。集合继续使用 `bytab.shortcuts`，文件夹与链接采用扁平存储，并在解析和写入时限制为一层。

对应代码为 `utils/shortcutCollections.ts`、`composables/useShortcuts.ts`、`useShortcutBar.ts`、`useDraggableShortcutBar.ts` 和现有快捷方式组件。`pnpm test:shortcuts:browser` 使用独立测试资料验证整栏拖动、固定／解锁、跨标签页同步、文件夹生命周期和窄屏边界；结果写入 `apps/extension/.output/shortcuts-verification`。

底部 Dock 恢复居中 90% 宽度（最大 76rem）和 36px 顶部弧边，保留 42% 白色背景不透明度。

### Dock 四向停靠与官方 Provider Logo

Settings 打开的现有设置弹窗为 Appearance，新增 Dock Position（Bottom / Top / Left / Right），点击立即生效并保存。底部仍为原有 90% 宽度、最大 76rem、80px 厚度、36px 弧边和透明玻璃效果；顶部镜像，左右复用同一个组件改为正常朝向的纵向排列，厚度 80px、最大高度 85svh，文件夹区域可滚动。面板向页面内部展开。桌面主内容尽量维持原位置，短窗口在安全区域内滚动，独立快捷方式和整栏拖动均避让当前停靠边。

本轮文件：

- `components/home/BookmarkDock.vue`、`assets/styles/dock-position.css`：统一 `data-position`、纵向分类滚动、四向面板、边缘安全区；样式只由扩展首页引入。
- `components/home/BackgroundSettings.vue`、`HomeTopBar.vue`、`pages/HomePage.vue`：Appearance 位置按钮、即时选中状态及保存错误提示。
- `utils/appearance.ts`、`composables/useBackground.ts`：在原有 `bytab.background` 对象内扩展 `dockPosition`，缺失或无效值回退 bottom。背景和位置通过同一 Web Lock 读取最新数据后合并写入，保留未知字段和自定义壁纸；保存失败回滚位置，不新建独立 Dock 存储。
- `utils/dockBounds.ts`、`composables/useDraggableShortcutBar.ts`、`components/home/ShortcutsPanel.vue`：方向变化或窗口缩放后重算拖动安全边界，不重写用户已保存的坐标。
- `components/home/ExtensionPromptBar.vue`：候选面板可用高度按实际停靠边避让；输入与导航规则保持一致。
- `components/home/PromptProviderIcon.vue`、`assets/providers/*`：ChatGPT、Claude、Grok、Gemini、Google、Bing 全部使用官方来源素材，离线打包，无运行时 Logo 网络请求。具体来源和校验值见 `assets/providers/README.md`。
- `tests/appearance.test.mjs`、`tests/dock.browser.mjs`、`package.json`：旧版兼容和四向浏览器验收，命令 `pnpm test:dock:browser`，截图与结果在 `.output/dock-verification`。

Dock 原实现按 Chrome 原生书签顺序显示，没有 Dock 图标拖动排序能力；本轮不新增该功能，验收验证切换方向不会修改书签树和排序。快捷方式自身的拖动、固定和文件夹管理继续保留。未修改官网的 Dock 布局。
