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
| GitHub CLI | https://cli.github.com/manual/gh_auth_login |

## gh

```bash
gh auth login
gh auth status
gh pr list
gh repo view OWNER/REPO
```

## gcloud

```bash
gcloud config set project lll-fish
gcloud secrets versions list cursor-secret --project=lll-fish
```
