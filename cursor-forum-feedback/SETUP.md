# cursor-forum-feedback セットアップ

## Discourse API 鍵(任意・自動投稿用)

鍵が無くても **下書き + ブラウザ手動投稿** で動作する。自動投稿したい場合のみ設定。

### 1. API 鍵を作成

1. [forum.cursor.com](https://forum.cursor.com) にログイン
2. 右上アイコン → **Preferences** → **API**
3. **Generate API Key**
   - User Level: **Single User**(自分のアカウントで投稿)
   - Scope: **Topics → write** 以上
4. 表示された API Key をコピー(再表示不可)

### 2. ローカルに配置(infra-secrets 準拠)

`~/.cursor/.env` に追加(`chmod 600` 相当。git に載せない):

```env
CURSOR_FORUM_API_KEY=your_api_key_here
CURSOR_FORUM_API_USER=your_forum_username
```

マルチマシン同期が必要なら [infra-secrets](../infra-secrets/SKILL.md) の GSM 手順で `cursor-forum-api-key` 等として保管し、各マシンで `~/.cursor/.env` に取り込む。

### 3. 動作確認

```bash
node ~/.cursor/skills/cursor-forum-feedback/scripts/post-to-forum.mjs \
  --dry-run --title "API test" --body "dry run only" --category 22
```

`--dry-run` は POST せずリクエスト内容を表示する。

### 4. 投稿フロー

- **鍵あり**: 下書きをユーザーに確認 → `post-to-forum.mjs` で投稿 → URL を報告
- **鍵なし**: 下書きファイル + カテゴリ URL をブラウザで開く → ユーザーが Paste + Post

## brain 連携(任意)

投稿下書きの保存先: `~/brain/forum-drafts/`

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\brain\forum-drafts"
```

## ログ収集(Windows)

```powershell
powershell -ExecutionPolicy Bypass -File `
  "$env:USERPROFILE\.cursor\skills\cursor-forum-feedback\scripts\collect-cursor-logs.ps1"
```

出力: `~/brain/forum-drafts/cursor-forum-bundle-<timestamp>.zip` または `%TEMP%`
