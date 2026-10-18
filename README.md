# 奶蛋 · 口袋王国（PWA 静态站点）

本仓库只包含 v0.23 的**构建产物**，由 `tools/build-pwa.mjs --site` 生成。
源码工程不在此仓库；此处内容用于 GitHub Pages 托管。

- 入口：index.html
- 离线缓存：sw.js（Service Worker，revision 内容哈希）
- 安装：manifest.webmanifest + icons/
- 部署：Settings → Pages → Deploy from a branch → main / (root)

首次 HTTPS 打开后等待「离线资源已就绪」，即可安装到桌面并断网游玩。
