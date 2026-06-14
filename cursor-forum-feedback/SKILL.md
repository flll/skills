---
name: cursor-forum-feedback
description: >-
  Cursor コミュニティフォーラムへのバグ報告・機能改善・小さなフィードバック投稿を支援する。
  クラッシュ時は Windows から必要ログを収集・秘匿処理し、Discourse API またはブラウザで投稿する。
  フォーラム投稿、cursor feedback、バグ報告、機能改善、クラッシュ報告、forum.cursor.com、
  Cursor Agent 改善に言及したとき、またはユーザーがフォーラムに送りたいときに使う。
disable-model-invocation: true
---

# cursor-forum-feedback — Cursor フォーラム投稿

**主経路は [forum.cursor.com](https://forum.cursor.com) のみ。** hi@cursor.com やメールサポートは使わない。
Help → Report Issue はクラッシュ時に任意で併記可(内部トラッキング用。個別返信なし)。

## トリガー

ユーザーが「フォーラムに投稿」「Cursor にフィードバック」「クラッシュを報告」等と言ったとき。
**まず自力で実行。できない時だけユーザーに頼む。**

## 手順

### 1. 種別判定

| 種別 | カテゴリ ID | URL |
|------|------------|-----|
| バグ(再現手順あり) | 6 | https://forum.cursor.com/c/support/bug-report/6 |
| 機能要望 / 改善 | 22 | https://forum.cursor.com/c/ideas/22 |
| 小さなフィードバック | 22 | 同上 |
| クラッシュ | 6 | ログ収集必須 |

詳細は [reference.md](reference.md)。

### 2. 環境情報収集(ユーザーに聞かず実行)

```powershell
# バージョン(複数パス)
& "$env:LOCALAPPDATA\Programs\cursor\resources\app\bin\cursor.cmd" --version
cursor --version

# 拡張機能(名前のみ)
cursor --list-extensions

# state.vscdb サイズ(本体は送らない)
Get-Item "$env:APPDATA\Cursor\User\globalStorage\state.vscdb" -ErrorAction SilentlyContinue |
  Select-Object Length, LastWriteTime
```

### 3. クラッシュ報告時 — ログ収集

```powershell
powershell -ExecutionPolicy Bypass -File `
  "$env:USERPROFILE\.cursor\skills\cursor-forum-feedback\scripts\collect-cursor-logs.ps1"
```

出力 zip を `~/brain/forum-drafts/` に保存(無ければ `%TEMP%`)。

```bash
node ~/.cursor/skills/cursor-forum-feedback/scripts/redact-logs.mjs <bundle-dir-or-zip>
```

### 4. 下書き生成

[templates/](templates/) をベースに Markdown を完成させる:

- `bug-report.md` — バグ / クラッシュ
- `feature-request.md` — 機能要望
- `feedback.md` — 小さな改善・問題提起

環境ブロック・再現手順・Expected/Actual を必ず埋める。ログは**抜粋**(末尾500行+エラー行)を本文に貼るか zip を添付。

### 5. 投稿(両方モード)

**A. API 鍵あり** — [SETUP.md](SETUP.md) 参照。`CURSOR_FORUM_API_KEY` + `CURSOR_FORUM_API_USER` が `~/.cursor/.env` 等にある場合:

```bash
node ~/.cursor/skills/cursor-forum-feedback/scripts/post-to-forum.mjs \
  --title "..." --body-file draft.md --category 6
```

**投稿前に必ずユーザーに下書き全文を見せて確認を取る。**

**B. API 鍵なし** — 下書きファイルを渡し、該当カテゴリ URL をブラウザで開く。ユーザーが Paste + Post。

### 6. brain 連携(任意)

投稿後、要旨を `~/brain/decisions/YYYYMMDD-forum-<slug>.md` に1行蒸留。

## 禁止

- `state.vscdb` 本体・brain/prompts の内容を zip や投稿に含めない
- API キー・トークンを Skill や投稿本文に平文で書かない
- ユーザー確認なしに API 自動投稿しない
- hi@cursor.com へのメール送信を案内しない

## セットアップ

Discourse API 鍵・マルチマシン同期: [SETUP.md](SETUP.md)
