---
name: infra-secrets
description: >-
  Cross-project secrets and infra auth for Cursor. GCP Secret Manager, secret.env,
  per-machine ~/.cursor/.env, gh for GitHub, Tailscale/Cloudflare/Docker tokens.
  Cloudflare Workers/Pages via wrangler and cf CLI (like gcloud). Use when fetching
  or rotating secrets, GSM, tailnet keys, cloud API auth, Workers/Pages deploy,
  or designing where credentials live across SSH hosts—never for app business logic.
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
| Cloudflare Workers/Pages | `wrangler` CLI | OAuth は `wrangler login`（マシンごとのローカルセッション） |
| Cloudflare 全体（DNS 等） | `cf` CLI | OAuth は `cf auth login`（technical preview） |

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

編集後は **flll/skills のみ** `git commit` + **能動的** `git push` + `sync-skills.sh`（日本語メッセージ）。**skills 以外への push は一切禁止**（ユーザーが amend する前提）→ [cursor-workflow](../cursor-workflow/SKILL.md)

**GitHub 操作** — `gh pr create`, `gh repo view`（アプリ repo への `git push` は cursor-workflow に従い禁止）

## CLI 認証の原則（gcloud / gh / wrangler / cf 共通）

1. **エージェントは CLI を第一選択** — REST を直接叩かず、`gcloud` / `gh` / `wrangler` / `cf` で操作する（`gcloud` と同様）。
2. **ログインはユーザーが行う** — エージェントが `wrangler login` / `cf auth login` / `gcloud auth login` / `gh auth login` を**勝手に実行しない**（ブラウザ操作が必要）。
3. **認証失敗時は再ログインを依頼して止まる** — 別マシン移行・OS クリーンインストール・セッション期限切れで CLI ログインが消えることがある。次のような出力なら **1 回報告して作業を中断**し、ユーザーに該当コマンドの再実行を依頼する:
   - `not logged in` / `re-authenticate` / `authentication may have expired`
   - `401` / `403` / `PERMISSION_DENIED` / `Failed to automatically retrieve account IDs`
   - `Your default credentials were not found`（gcloud ADC）
4. **再試行しない** — トークンを推測・生成したり、同じ認証エラーをループしない。
5. **作業前の確認**（非対話・値は出さない）:

```bash
gcloud auth list
gh auth status
wrangler whoami
cf auth whoami
```

## Tailscale（汎用）

- Auth key は **`tskey-auth-...`**。OAuth client secret（`tskey-client-...`）を `TS_AUTHKEY` にしない。
- タグ付きノードは tailnet ACL に `tagOwners` が無いと失敗する。タグ名は**対象プロジェクト**の compose / ドキュメントを確認。
- Docker サイドカー: `network_mode: service:tailscale-*`、`cap_add: [net_admin]`。鍵は compose の `env_file` で `~/.cursor/.env` を最後に読むと上書きしやすい。

## Cloudflare（Workers / Pages / DNS）

**ツールの使い分け**

| CLI | 用途 |
|-----|------|
| `wrangler` | Workers・Pages の開発・デプロイ（`wrangler dev`, `wrangler deploy`, `wrangler pages deploy`） |
| `cf` | アカウント横断操作（DNS、zones、registrar 等・technical preview） |

**インストール**（マシンごと・ログインは別）:

```bash
npm install -g wrangler cf
```

**認証**（ユーザーが手動。エージェントは依頼のみ）:

```bash
wrangler login          # Workers / Pages
cf auth login           # 統合 CLI
```

**API トークン経由**（`secret.env` の `CLOUDFLARE_API_TOKEN`）も使えるが、OAuth セッションとは別。GSM 取り込み後に `CLOUDFLARE_ACCOUNT_ID` を `wrangler.toml` や環境変数に設定。

- `CLOUDFLARE_API_TOKEN`: 通常 **User API Token**（ゾーン・権限を最小化）。`cfat_` は長期サービス向け。
- `CLOUDFLARE_ACCOUNT_ID` はトークンと別。ダッシュボードの Account ID。

**デプロイ例**（プロジェクトの `wrangler.toml` / README を先に確認）:

```bash
wrangler deploy
wrangler pages deploy ./dist
cf dns records list --zone example.com
```

## コミット・ブランチ

アプリリポジトリでの commit / ブランチ判断 / push 禁止 → **[cursor-workflow](../cursor-workflow/SKILL.md)**（ここでは書かない）。

## やってはいけない

- `secret.env` / `.env` の中身を要約や diff でチャットに出す
- 無権限の API でキー発行を試み続ける（ACL / OAuth scope エラーは一度報告して止まる）
- プロジェクト名を決め打ちしてコマンドを実行する（cwd と README/Makefile を先に確認）

詳細コマンド・URL: [reference.md](reference.md)
