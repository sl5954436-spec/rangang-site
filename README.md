# 染缸传媒官网 · RANGANG MEDIA

夜店声光电 & 品牌一站式官网，纯静态单页（原生 HTML/CSS/JS，无构建、无依赖），直接托管在 GitHub Pages。

- `index.html` —— 官网首页（首屏动效、服务、案例视频、流程、主理、团队、留言）
- `admin.html` —— 后台 CMS（可视化改内容、上传图片/视频、导出发布页）
- `assets/` —— 图片与案例视频
- `_backup/` —— 历史版本
- `_cloudflare/` —— 之前做的一版 Cloudflare D1/R2 后端（可选，目前未启用，留着以后需要云端同步再用）

## 部署到 GitHub Pages（已完成）

- 线上地址：**https://sl5954436-spec.github.io/rangang-site/**
- 代码仓库：`https://github.com/sl5954436-spec/rangang-site`（Public）
- Pages 配置：Deploy from a branch → main → / (root)，每次 push 到 main 自动重新构建

> 免费 GitHub 账号的 Pages 只支持 Public 仓库，所以这个仓库设置成了 Public。站点本身公开访问，代码里的 `_cloudflare/` 也一并公开（不含任何密钥，`.dev.vars` 已在 .gitignore 里）。

想绑 `ranggang.media`：Pages 页面填 Custom domain，然后在域名 DNS 加 CNAME 指向 `sl5954436-spec.github.io`。

## 改内容的流程（重点）

纯静态站没有数据库，后台改完必须“导出 + 推送”才会生效：

1. 本地起个预览服务（任选其一）：
   ```powershell
   python -m http.server 8090
   ```
   打开 `http://127.0.0.1:8090/admin.html`
2. 在后台改内容、上传图片/视频（本地模式会直接复制进 `assets/`）
3. 点 **数据备份 → 导出发布页**，下载新的 `index.html`
4. 用它覆盖 `H:\...\染缸官网\index.html`，然后双击 **`deploy.ps1`**（一键 add / commit / push，令牌存在同目录 `.git-token`，已被 gitignore）
5. GitHub Pages 自动重建，约 1 分钟后线上生效

> 后台右上角显示「本地模式」是正常的：静态站没有接口可连。之前那套 D1 云端同步在 `_cloudflare/` 里，需要时可以再启用。

## 后台功能

- 站点配置：品牌名、标语、标签、邮箱电话、微信推送（Server酱 / PushPlus）
- 服务配方 / 案例战绩 / 流程步骤 / 团队 / 主理人 / 语录：增删改
- 案例支持**视频**：上传后自动填路径，卡片悬停播放、点击放大
- 数据备份：导出 JSON（存档）、导入 JSON（恢复）、导出发布页（生成线上 index.html）

## 留言说明

静态站收不到访客表单（提交内容只存在访客自己的浏览器）。要拿到线索，在「站点配置」里开启微信通知：填 Server酱 SendKey 或 PushPlus token，访客提交时你的微信会收到推送。

## 本机工具链

```powershell
# 预览
python -m http.server 8090 --directory "H:\Users\Administrator\Desktop\染缸文化传媒\染缸官网"

# 推送（首次需要 GitHub 授权）
git push
```

## 备注

- 图片/视频建议压到 720p、单个 3MB 以内，手机打开更顺
- 案例视频命名随意，后台会按上传的文件名生成路径
- `_backup/`、`*.bak-*`、`index..html` 都在 `.gitignore` 里，不会进仓库
