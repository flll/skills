# cursor-forum-feedback — リファレンス

## フォーラムカテゴリ

| 名前 | category ID | 新規投稿 URL |
|------|-------------|--------------|
| Bug Reports | 6 | https://forum.cursor.com/c/support/bug-report/6 |
| Ideas / Feature Requests | 22 | https://forum.cursor.com/c/ideas/22 |

投稿はブラウザ手動のみ（API 自動投稿は使わない）。

## Windows ログパス

| 種別 | パス |
|------|------|
| ログルート | `%APPDATA%\Cursor\logs\` |
| 最新セッション | 上記配下で `LastWriteTime` 最大のフォルダ |
| main.log | `<session>\main.log` |
| renderer | `<session>\window*\renderer*.log` |
| extension host | `<session>\exthost\*\*.log` |
| state DB(サイズのみ) | `%APPDATA%\Cursor\User\globalStorage\state.vscdb` |
| corrupted 痕跡 | `state.vscdb.corrupted.*` の有無・サイズ |

## Cursor バイナリ(Windows)

```
%LOCALAPPDATA%\Programs\cursor\Cursor.exe
%LOCALAPPDATA%\Programs\cursor\resources\app\bin\cursor.cmd
C:\Program Files\cursor\resources\app\bin\cursor.cmd   # 古いシステムインストール
```

## 収集する / しない

| 収集 | しない |
|------|--------|
| main.log / renderer.log(直近、tail 500行+エラー行) | state.vscdb 本体 |
| manifest.json / environment.txt | API キー・トークン |
| 拡張機能名リスト | brain / prompts |
| state.vscdb サイズ・corrupted 有無 | チャット全文 |

## ログサイズ上限

- 単一ファイル: 最大 **2 MB** をコピー(超える場合は末尾 500 行 + `[error]`/`oom`/`-536870904` 含む行)
- zip 全体: 推奨 **10 MB 未満**(フォーラム添付制限を考慮)

## redact パターン(redact-logs.mjs)

- `gho_[A-Za-z0-9]+` → `[REDACTED_GH_TOKEN]`
- `sk-[A-Za-z0-9]+` → `[REDACTED_API_KEY]`
- `Bearer [A-Za-z0-9._-]+` → `Bearer [REDACTED]`
- メールアドレス → `[REDACTED_EMAIL]`
- `C:\Users\<username>\` → `C:\Users\<user>\`(ユーザー名は残しても可。要望あれば完全マスク)

## 環境ブロックテンプレート

```
Cursor Version: (from cursor --version or About)
VSCode Version: (from product.json if available)
Commit: 
Date: 
Electron: 
OS: Windows 11 Build xxxxx
```

## クラッシュでよく見るシグネチャ

- `renderer process gone (reason: oom, code: -536870904)`
- `state.vscdb.corrupted`
- `Extension host terminated unexpectedly`
- `Loading chat` ループ

## Help → Report Issue(任意)

IDE: Help → Report Issue — 内部トラッキング用。フォーラム投稿と併用可。個別返信はない。
