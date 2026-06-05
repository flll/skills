---
name: infra-secrets
description: >-
  Cross-project secrets and infra auth for Cursor. GCP Secret Manager, secret.env,
  per-machine ~/.cursor/.env, gh for GitHub, Tailscale/Cloudflare/Docker tokens.
  Use when fetching or rotating secrets, GSM, tailnet keys, cloud API auth, or
  designing where credentials live across SSH hosts—never for app business logic.
---

# infra-secrets

## 原則（必ず守る）

1. **正本は 1 箇所** — エージェントは推測で値を作らない。無ければユーザーに発行・配置を依頼する。
2. **git に秘密を載せない** — このリポジトリ（flll/skills）含む。例・プレースホルダのみ。
3. **チャット / Rules に値を貼らない** — 変数名とパスだけ言う。
4. **GitHub は `gh`** — `GITHUB_TOKEN` を `secret.env` や GSM に入れない。`gh auth login` 済みを前提に `gh` / `git` を使う。
5. **プロジェクト固有の手順は各リポジトリ** — Compose タグ名・make ターゲット・ACL はそのプロジェクトの docs を読む。ここでは置かない。

## 配置（マシンごと）

| 層 | パス | 中身 |
|----|------|------|
| 共有 API トークン | `~/.cursor/secrets/secret.env` | Cloudflare, Tailscale OAuth/API, Docker Hub 等（`chmod 600`） |
| マシン永続・高感度 | `~/.cursor/.env` | `TS_AUTHKEY`, `TAILNET`, `TS_EXTRA_ARGS` など（GSM に載せない運用可） |
| GitHub | `gh` 設定 | `~/.config/gh/`（`gh auth login`） |
| GCP 取得 | `gcloud` ADC | `gcloud auth login` 済みなら SA JSON パス不要 |

## エージェントの標準手順

**取り込み（GSM → ローカル）**

```bash
gcloud secrets versions access latest --secret=cursor-secret --project=lll-fish \
  > ~/.cursor/secrets/secret.env
chmod 600 ~/.cursor/secrets/secret.env
```

**反映（ローカル → GSM）** — ユーザーが編集したあと、値をログに出さず:

```bash
gcloud secrets versions add cursor-secret \
  --data-file="$HOME/.cursor/secrets/secret.env" \
  --project=lll-fish
```

**Skills 同期（このリポジトリ）**

```bash
~/.cursor/skills-repo/scripts/sync-skills.sh
~/.cursor/skills-repo/scripts/verify-skills.sh
```

編集後は **flll/skills のみ** `git commit` + `git push`（日本語メッセージ）。アプリ repo への push は禁止。

**GitHub 操作** — `gh pr create`, `gh repo view`（アプリ repo への `git push` は cursor-workflow に従い禁止）

## Tailscale（汎用）

- Auth key は **`tskey-auth-...`**。OAuth client secret（`tskey-client-...`）を `TS_AUTHKEY` にしない。
- タグ付きノードは tailnet ACL に `tagOwners` が無いと失敗する。タグ名は**対象プロジェクト**の compose / ドキュメントを確認。
- Docker サイドカー: `network_mode: service:tailscale-*`、`cap_add: [net_admin]`。鍵は compose の `env_file` で `~/.cursor/.env` を最後に読むと上書きしやすい。

## Cloudflare

- `CLOUDFLARE_API_TOKEN`: 通常 **User API Token**（ゾーン・権限を最小化）。`cfat_` は長期サービス向け。
- `CLOUDFLARE_ACCOUNT_ID` はトークンと別。ダッシュボードの Account ID。

## コミット・ブランチ

アプリリポジトリでの commit / ブランチ判断 / push 禁止 → **[cursor-workflow](../cursor-workflow/SKILL.md)**（ここでは書かない）。

## やってはいけない

- `secret.env` / `.env` の中身を要約や diff でチャットに出す
- 無権限の API でキー発行を試み続ける（ACL / OAuth scope エラーは一度報告して止まる）
- プロジェクト名を決め打ちしてコマンドを実行する（cwd と README/Makefile を先に確認）

詳細コマンド・URL: [reference.md](reference.md)
