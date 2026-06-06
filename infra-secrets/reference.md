# infra-secrets reference

## GSM（既定）

| キー | 値 |
|------|-----|
| プロジェクト | `lll-fish` |
| シークレット | `cursor-secret` |

## secret.env（想定キー・値は各マシンで管理）

| 変数 | 用途 |
|------|------|
| `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_CLIENT_SECRET` | Tailscale API（Trust credentials） |
| `TS_API_ACCESS_TOKEN` | 代替: `tskey-api-...` |
| `TAILNET` | `*.ts.net` |
| `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` | DNS / API |
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | レジストリ |
| `SNYK_TOKEN` | Snyk API（CI・別マシン用・任意） |

含めない: `GITHUB_TOKEN`, 生の `TS_AUTHKEY`（方針上は `~/.cursor/.env` 推奨）

## ~/.cursor/.env（例）

```bash
TAILNET=example.ts.net
TS_AUTHKEY=tskey-auth-...
TS_EXTRA_ARGS=--advertise-tags=tag:example --accept-dns=true
```

## 発行 URL

| 項目 | URL |
|------|-----|
| Tailscale auth key | https://login.tailscale.com/admin/settings/keys |
| Tailscale OAuth | https://login.tailscale.com/admin/settings/trust-credentials |
| Tailscale ACL | https://login.tailscale.com/admin/acls |
| Cloudflare token | https://dash.cloudflare.com/profile/api-tokens |
| Cloudflare Workers docs | https://developers.cloudflare.com/workers/ |
| Cloudflare Pages docs | https://developers.cloudflare.com/pages/ |
| cf CLI（technical preview） | https://blog.cloudflare.com/cf-cli-local-explorer/ |
| GitHub CLI | https://cli.github.com/manual/gh_auth_login |
| Snyk アカウント / API token | https://app.snyk.io/account |
| Snyk CLI ドキュメント | https://docs.snyk.io/developer-tools/snyk-cli |

## gh

```bash
gh auth login
gh auth status
gh pr list
gh repo view OWNER/REPO
```

## gcloud

```bash
gcloud auth list
gcloud config set project lll-fish
gcloud secrets versions list cursor-secret --project=lll-fish
# Windows: stdout だと Unicode エラーになることがある → --out-file を使う
gcloud secrets versions access latest --secret=cursor-secret --project=lll-fish \
  --out-file="$HOME/.cursor/secrets/secret.env"
```

## wrangler（Workers / Pages）

```bash
# インストール（マシンごと）
npm install -g wrangler

# 認証確認（未ログインならエラー → ユーザーに wrangler login を依頼）
wrangler whoami

# 開発・デプロイ（プロジェクト直下で）
wrangler dev
wrangler deploy
wrangler pages deploy ./dist --project-name=MY_PROJECT
```

## cf（Cloudflare 統合 CLI・technical preview）

```bash
# インストール（wrangler と併用）
npm install -g cf

# 認証確認（未ログインならエラー → ユーザーに cf auth login を依頼）
cf auth whoami

# アカウント・DNS 等（例）
cf accounts list
cf zones list
cf dns records list --zone example.com
```

## snyk

```bash
# インストール（マシンごと）
npm install -g snyk

# 認証確認（未ログインならエラー → ユーザーに snyk auth を依頼）
snyk whoami

# OpenClaw モノレポ例
cd ~/.openclaw
snyk test --all-projects --severity-threshold=high
snyk monitor --all-projects

# Go + Docker 例
snyk test
snyk container test <image:tag>

# CI 用（任意）
export SNYK_TOKEN=<token>
snyk test
```

Windows: `snyk` が見つからないときは `%APPDATA%\npm\snyk.cmd`

## CLI 認証エラー時（エージェント向け）

認証エラーを検出したら **1 回報告して中断**。ユーザーに次を案内（値は貼らない）:

| CLI | ユーザーが実行するコマンド |
|-----|---------------------------|
| gcloud | `gcloud auth login`（ADC が必要なら `gcloud auth application-default login`） |
| gh | `gh auth login` |
| wrangler | `wrangler login` |
| cf | `cf auth login` |
| snyk | `snyk auth`（または `SNYK_TOKEN` を設定） |

よくある原因: 別マシンからの移行、OS 再インストール、OAuth セッション期限切れ。`secret.env` の API トークンだけでは `wrangler whoami` / `cf auth whoami` / `snyk whoami` は通らない場合がある。
