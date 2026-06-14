# cursor-forum-feedback セットアップ

## 投稿方法の優先順位

| 方法 | 誰でも使える | 設定 |
|------|-------------|------|
| **ブラウザ手動投稿（推奨）** | はい | 不要 |
| User API 鍵（自動投稿） | はい | 下記「一般ユーザー向け」 |
| Admin API 鍵（自動投稿） | フォーラム管理者のみ | 下記「管理者のみ」 |

**以前の「Preferences → API → Generate API Key」手順は誤りでした。**
forum.cursor.com の一般ユーザー向け Preferences には API 鍵生成 UI はありません（[Discourse Meta の説明](https://meta.discourse.org/t/can-non-admin-user-issue-their-own-api-key/173226) でも同様）。

鍵が無くても **下書き + ブラウザ手動投稿** で Skill は完結します。

---

## 推奨: 鍵なし（ブラウザ手動投稿）

1. Skill が下書き Markdown を生成
2. ユーザーが全文を確認
3. 該当カテゴリをブラウザで開く
   - Bug: https://forum.cursor.com/c/support/bug-report/6
   - Ideas: https://forum.cursor.com/c/ideas/22
4. 本文を Paste → Post

---

## 任意: User API 鍵（一般ユーザーが取れる唯一の自動投稿用鍵）

Discourse の **User API Key** プロトコルが必要です。モバイルアプリと同系統で、専用の承認フロー経由でのみ発行されます。

### 1. 鍵を生成

[forum.cursor.com](https://forum.cursor.com) にログインした状態で:

```bash
npx discourse-api-key-generator --app=cursor-forum-feedback --url=https://forum.cursor.com
```

1. ブラウザが開き、承認画面が表示される
2. 承認後、画面に **base64 エンコードされた鍵** が表示される
3. ターミナルにその文字列を貼り付ける
4. 表示された API key をコピー

`client_id` はコマンド実行マシンの **ホスト名**（`os.hostname()`）です。鍵はそのマシン専用として扱います。

### 2. ローカルに配置（infra-secrets 準拠）

`~/.cursor/.env` に追加（git に載せない）:

```env
CURSOR_FORUM_USER_API_KEY=your_user_api_key_here
CURSOR_FORUM_USER_API_CLIENT_ID=your_machine_hostname
```

`USER_API_CLIENT_ID` は鍵生成時と同じマシンのホスト名。確認:

```powershell
hostname
```

マルチマシン同期が必要なら [infra-secrets](../infra-secrets/SKILL.md) の GSM 手順で保管し、各マシンで `~/.cursor/.env` に取り込む。

### 3. 動作確認

```bash
node ~/.cursor/skills/cursor-forum-feedback/scripts/post-to-forum.mjs \
  --dry-run --title "API test" --body "dry run only" --category 22
```

`--dry-run` は POST せずリクエスト内容を表示する。

### 4. 投稿フロー

- **User API 鍵あり**: 下書きをユーザーに確認 → `post-to-forum.mjs` で投稿 → URL を報告
- **鍵なし**: 下書きファイル + カテゴリ URL をブラウザで開く → ユーザーが Paste + Post

### 注意

- User API 鍵は **180 日未使用で失効** する場合があります（Discourse 既定）
- 承認済みアプリは forum の **Preferences → Apps** で確認・失効できます
- `discourse-api-key-generator` はサードパーティ CLI です。動かない場合はブラウザ手動投稿にフォールバック

---

## 管理者のみ: Admin API 鍵

フォーラム **管理者** が Admin → Advanced → API Keys で作成する鍵です。一般ユーザーは取得できません。

```env
CURSOR_FORUM_API_KEY=admin_api_key_here
CURSOR_FORUM_API_USER=forum_username
```

`post-to-forum.mjs` は User API 鍵を優先し、無い場合に Admin API 鍵を使います。

---

## brain 連携（任意）

投稿下書きの保存先: `~/brain/forum-drafts/`

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\brain\forum-drafts"
```

## ログ収集（Windows）

```powershell
powershell -ExecutionPolicy Bypass -File `
  "$env:USERPROFILE\.cursor\skills\cursor-forum-feedback\scripts\collect-cursor-logs.ps1"
```

出力: `~/brain/forum-drafts/cursor-forum-bundle-<timestamp>.zip` または `%TEMP%`
