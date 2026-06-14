# cursor-forum-feedback セットアップ

投稿は **ブラウザ手動のみ**。API 自動投稿は採用しない。

## 投稿手順

1. Skill が下書き Markdown を生成
2. ユーザーが全文を確認
3. 該当カテゴリをブラウザで開く
   - Bug: https://forum.cursor.com/c/support/bug-report/6
   - Ideas: https://forum.cursor.com/c/ideas/22
4. 本文を Paste → Post

## brain 連携（任意）

投稿下書きの保存先: `~/brain/forum-drafts/`

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\brain\forum-drafts"
```

## ログ収集（Windows・クラッシュ報告時）

```powershell
powershell -ExecutionPolicy Bypass -File `
  "$env:USERPROFILE\.cursor\skills\cursor-forum-feedback\scripts\collect-cursor-logs.ps1"
```

出力: `~/brain/forum-drafts/cursor-forum-bundle-<timestamp>.zip` または `%TEMP%`
