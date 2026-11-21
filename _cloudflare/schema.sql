-- 与 migrations/0001_init.sql 一致，供 Cloudflare 控制台手动执行

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
