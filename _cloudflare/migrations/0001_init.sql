-- 染缸官网 · D1 初始化
-- 站点内容整包存放（后台保存时整体覆盖），另有访客留言表

CREATE TABLE IF NOT EXISTS site_data (
  id         INTEGER PRIMARY KEY,
  json       TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL DEFAULT '',
  contact    TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT '',
  brief      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_created ON messages (created_at DESC);
