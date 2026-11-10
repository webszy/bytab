# bytab / Brand Asset Kit v1.0

2026-11-10 · bytab.dev

这是基于已确认的新标签页 UI 风格与选定 App Icon 制作的品牌资产包。
主图标使用「柔和日出 + 远山 + 浏览器窗口 + 书签」语言；简化版供小尺寸和高对比场景使用。

## Quick start / 立即使用
- Chrome Web Store / Chrome extension:
  `03_Chrome_Extension/icon-16.png`, `icon-32.png`, `icon-48.png`, `icon-128.png`。
  如果 16px 时内容显得拥挤，可改用 `icon-minimal-16.png`。
- Website brand logo:
  `02_Logo_Lockups/horizontal-charcoal.svg` 用于浅色背景，
  `horizontal-white.svg` 用于深色背景。
- Official app icon / 主图标:
  `01_Master_SVG/bytab-app-icon-full.svg` 为可编辑的矢量源文件。
- Favicon and PWA:
  `04_Favicon_and_PWA/` 中有 favicon.ico、favicon.svg、apple-touch-icon.png、
  webmanifest 和 HTML head 示例。实际部署时需要按项目结构修改 URL。
- Social share preview:
  `05_Social_and_Marketing/og-card.png`、`x-header.png`、`square-social.png`。
- Colors / design tokens:
  `06_Design_Tokens/bytab-tokens.css`、`bytab-tokens.json`。
- Visual guidelines / 视觉规范:
  `07_Guidelines/Brand_Guidelines.pdf` 及 `brand-guidelines.html`。

## Directory / 目录
01_Master_SVG — 全彩、极简、单色、透明图形的 SVG 矢量文件
02_Logo_Lockups — 横版、竖版、字标；SVG + PNG
03_Chrome_Extension — Chrome 插件用 PNG 和 manifest 示例
04_Favicon_and_PWA — 站点图标、PWA、Maskable icon
05_Social_and_Marketing — OG 分享图、X 头图、方图 (SVG + PNG)
06_Design_Tokens — CSS、JSON 和 DTCG 风格 Token
07_Guidelines — PDF 和 HTML 使用说明
08_Preview — 品牌资产总览
09_References — 之前确认的 Logo 展示板和 UI 参考（如提供）

## Notes / 使用说明
1. SVG 的文字均已转换为路径（无需安装字体）；未附带任何第三方字体文件。
2. 配色原型包含 Charcoal #1F2329、Sky #E3EEFF、Lavender #E8E0FF、Sunrise #FFD9C3、Off-White #F9FAFC。
3. logo 水平间距和图标安全边距已设定；不要拉伸、更换混乱颜色或与复杂图案重叠。
4. 图标 SVG 为矢量图形（不是嵌入的位图），可在 Figma、Illustrator、Sketch 和浏览器中编辑/使用。
5. 本套品牌为设计交付，不包含商标近似性检索和注册意见；上线前按目标市场检索。
6. site.webmanifest 与示例 manifest.json 为集成示例，并非项目真实功能清单。
7. Chrome 插件上架时需自己核对 Chrome Web Store 对于商品图、截图和宣传图的最新规格。
