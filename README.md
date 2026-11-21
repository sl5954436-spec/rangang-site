# 染缸传媒官网 · RANGANG MEDIA

单页官网（原生 HTML/CSS/JS）+ 后台 CMS + Cloudflare 云端内容库。

- 静态站点：`index.html` / `admin.html` / `assets/`
- 服务端接口：`functions/api/*`（Cloudflare Pages Functions）
- 内容存储：Cloudflare **D1**（站点内容 JSON + 访客留言）
- 媒体存储：Cloudflare **R2**（后台直传的图片 / 视频）

## 为什么托管选 Cloudflare Pages，而不是 GitHub Pages

GitHub Pages 只能托管静态文件，**没有服务端**，D1 数据库、后台上传接口都跑不起来（后台会退回“只存本机浏览器”）。

推荐的组合是：**代码放 GitHub，托管走 Cloudflare Pages**。Cloudflare Pages 支持直接连 GitHub 仓库，推送即自动部署；D1 和 R2 都在同一账号下绑定，后台保存后所有访客看到的是同一份内容。

如果你确实只想用 GitHub Pages，也能跑，但只能得到静态页面，后台保存仅对本机浏览器有效（需要改数据就只能改 HTML 或提交 JSON）。

## 目录

```
index.html            官网首页（读取 /api/site，失败时回落 localStorage / 内置默认）
admin.html            后台 CMS（检测到 /api/site 自动切 D1 模式，否则本地模式）
assets/               静态图 + 示例视频（仓库自带，线上优先走 R2）
functions/api/site.js       GET 读取内容 / PUT 保存内容（需 ADMIN_TOKEN）
functions/api/upload.js     POST 上传图片视频到 R2（需 ADMIN_TOKEN）
functions/api/message.js    POST 访客留言 / GET 列表 / DELETE 删除
functions/media/[[path]].js GET 读取 R2 文件（支持 Range，视频可拖动）
migrations/0001_init.sql    D1 建表
schema.sql                  同上，供控制台手动执行
wrangler.toml               Pages / D1 / R2 绑定配置
```

## 首次部署

前置：Node 18+、Cloudflare 账号、已安装依赖（`npm install`）。

```powershell
# 1. 登录 Cloudflare（会弹出浏览器授权）
npx wrangler login

# 2. 建 D1 数据库，记下输出里的 database_id
npx wrangler d1 create rangang

# 3. 把 database_id 填进 wrangler.toml 的 REPLACE_WITH_YOUR_D1_DATABASE_ID

# 4. 建 R2 桶（也可在控制台建）
npx wrangler r2 bucket create rangang-media

# 5. 建表（远程）
npx wrangler d1 execute rangang --remote --file=./schema.sql

# 6. 设置后台密码（把 xxx 换成你自己的长密码）
npx wrangler pages secret put ADMIN_TOKEN --project-name rangang-site

# 7. 首次部署
npx wrangler pages deploy . --project-name rangang-site
```

部署完控制台会给一个 `*.pages.dev` 域名。把 `ranggang.media` 接进来：Cloudflare 控制台 → Workers & Pages → 你的项目 → Custom domains → 添加域名，按提示改 DNS。

### 用 GitHub 自动部署（推荐）

1. 在 GitHub 建一个空仓库（Private 即可）
2. 本仓库推上去：

```powershell
git init
git add .
git commit -m "init: 官网 + CMS + Cloudflare D1/R2"
git branch -M main
git remote add origin https://github.com/<你的账号>/<仓库名>.git
git push -u origin main
```

3. Cloudflare 控制台 → Workers & Pages → Create → Pages → Connect to Git → 选仓库
4. 构建配置：Framework 选 None，Build command 留空，Build output directory 填 `/`
5. Settings → Variables and Secrets 里加 `ADMIN_TOKEN`（类型 Secret），并在 Settings → Functions → D1 / R2 绑定 `DB`、`MEDIA`

之后每次 `git push` 都会自动重建发布。

## 本地开发

```powershell
copy .dev.vars.example .dev.vars   # 填本地 ADMIN_TOKEN
npm run dev                       # http://127.0.0.1:8788
```

本地 D1 建表：`npx wrangler d1 execute DB --local --file=./schema.sql`（或在 `npm run dev` 起来后对 `.wrangler/state` 下的 sqlite 执行）。

## 后台使用

- 打开 `/admin.html`，右上角出现「D1 在线同步」即表示已连云端；显示「本地模式」说明没检测到接口。
- 第一次点保存/上传会要求输入 `ADMIN_TOKEN`，输入后记在本机 localStorage，可在浏览器控制台执行 `localStorage.removeItem('rangang_admin_token')` 重设。
- 案例的封面图和视频都用「上传」按钮，线上会传到 R2 并回填 `/media/...` 路径；本地模式则复制进 `assets/`。
- 访客留言进 D1，后台「留言管理」点刷新即可看到。
- 「数据备份」里的导出 JSON 是整包内容，可随时导入恢复。

## 接口速查

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/site` | 公开 | 读取站点内容，空库返回 `data:null` |
| PUT | `/api/site` | `x-admin-token` | 整包保存，上限 1MB |
| POST | `/api/message` | 公开 | 访客提交留言 |
| GET | `/api/message` | `x-admin-token` | 最近 200 条留言 |
| DELETE | `/api/message?id=1` / `?all=1` | `x-admin-token` | 删除单条 / 清空 |
| POST | `/api/upload` | `x-admin-token` | 上传媒体到 R2，≤60MB |
| GET | `/media/<key>` | 公开 | 读取 R2 文件，支持 Range |

## 注意

- `wrangler.toml` 里的 D1 ID、R2 桶名属于非敏感配置，可以提交；`ADMIN_TOKEN` 只能放 Secret，**不要写进仓库**。
- `.dev.vars`、`.wrangler/`、`node_modules/` 已在 `.gitignore` 排除。
- 站点内容整包存一行 JSON，保存即覆盖；多人同时改会互相覆盖，目前是单人后台的使用方式。
