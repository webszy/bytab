# New Tab design assets

The source for this UI is `_docs/design/ext_home/code.html`; the companion
`DESIGN.md` and `screen.png` are supporting references. HTML dimensions and the
final inline Dock styles take precedence over the broader design-system notes.

- The inline SVG geometry is preserved in `components/home/home-icons.ts`.
- The wordmark uses the Latin 600-weight Plus Jakarta Sans font, self-hosted in
  `assets/fonts/`. Its SIL Open Font License is included as
  `public/licenses/plus-jakarta-sans-OFL.txt` and copied into the packaged extension.
  Source: Google Fonts (`fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600`).
  Body text follows the source's macOS-first system font stack.
- No Tailwind CDN, remote scripts, remote stylesheets, remote fonts, or icon
  libraries are required at runtime.

## Wallpaper

On 2026-11-09, the wallpaper URL in the Stitch HTML redirected to a Google
Accounts sign-in HTML document instead of returning an image. The user then
provided `apps/shared/wallpapers/default.png` (1679 × 937). It is copied unchanged
to `assets/wallpapers/default.png` so this application can build and run independently.
Both the full-page background and Appearance thumbnail use that local copy.
Vite packages it into the extension; no remote image request is made. The image
uses centered cover sizing, with the source's white tint and vertical lighting
gradient. A neutral color remains underneath while it decodes.

Original URL:

```text
https://lh3.googleusercontent.com/aida/ALJJyrCMyUYntvyAO737oXGDw-4fuQBe4E5mtV3youyF50ZyF3KlI89SfT6nR2p8gXKKHo_SF6mWPZCXyqiLGW7Vx0wVPkestvzufb1V-ss-FdZ_x_jGDPRzIwVspyuYTef4DcpUIczD6Dn8zb-qBr8X5Fx7ADtPJu3mI4t6Iwxc_BSP0JmqIVusa6A5Rg1In60N6Nd-khyCkhRtdsk4-0qdJmL5r6_VPw9zwyPje1I579IUkw
```

The wallpaper is selected by `--home-wallpaper` in `assets/styles/home.css`.
There is no upload or persistence feature.

The Dock folder names are isolated design demonstration data. Its "Demo folders"
subtitle and disabled preview controls distinguish them from the real, read-only
Chrome bookmark count. Prompt text and model selection remain in page memory;
prompt submission is disabled.
