# infra-accounts reference

## GSM

| 項目 | 値 |
|------|-----|
| プロジェクト | `lll-fish` |
| シークレット名 | `cursor-secret` |

`GITHUB_TOKEN` は **含めない**（GitHub は `gh auth login`）。

```bash
gcloud secrets versions access latest --secret=cursor-secret --project=lll-fish \
  > ~/.cursor/secrets/secret.env && chmod 600 ~/.cursor/secrets/secret.env
```

## GitHub（gh CLI）

```bash
gh auth login
gh auth status
```

| 操作 | コマンド |
|------|----------|
| Skills 同期 | `make skills-sync`（Bananacraft） |
| PR | `gh pr create` / `gh pr list` |
| リポジトリ | `gh repo view flll/skills` |

詳細: Bananacraft `infra/github.md`

## ~/.cursor/.env

雛形: Bananacraft `infra/cursor.env.example`

## ACL

```json
"tagOwners": {
  "tag:bananacraft": ["autogroup:admin"]
}
```

## 発行 URL

| 項目 | URL |
|------|-----|
| `TS_AUTHKEY` | https://login.tailscale.com/admin/settings/keys |
| OAuth | https://login.tailscale.com/admin/settings/trust-credentials |
| `CLOUDFLARE_API_TOKEN` | https://dash.cloudflare.com/profile/api-tokens |
