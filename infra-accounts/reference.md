# infra-accounts reference

## GSM

| 項目 | 値 |
|------|-----|
| プロジェクト | `lll-fish` |
| シークレット名 | `cursor-secret` |

```bash
gcloud secrets versions access latest --secret=cursor-secret --project=lll-fish \
  > ~/.cursor/secrets/secret.env && chmod 600 ~/.cursor/secrets/secret.env
```

## ~/.cursor/.env（Tailnet・git 非推奨・ローカルのみ）

```bash
# 雛形: infra/cursor.env.example
TAILNET=qilin-scala.ts.net
TS_AUTHKEY=tskey-auth-...
TS_EXTRA_ARGS=--advertise-tags=tag:bananacraft --accept-dns=true
```

## ACL（一度だけ）

```json
"tagOwners": {
  "tag:bananacraft": ["autogroup:admin"]
}
```

[Access controls](https://login.tailscale.com/admin/acls)

## 発行 URL

| 変数 | URL |
|------|-----|
| `TS_AUTHKEY` | [Auth keys](https://login.tailscale.com/admin/settings/keys) |
| OAuth | [Trust credentials](https://login.tailscale.com/admin/settings/trust-credentials) |
| `CLOUDFLARE_API_TOKEN` | [API Tokens](https://dash.cloudflare.com/profile/api-tokens) |
| `GITHUB_TOKEN` | [Fine-grained](https://github.com/settings/personal-access-tokens) |

## Cloudflare

`CLOUDFLARE_API_TOKEN` には通常 **User API Token**（カスタム・ゾーン限定）を入れる。長期サービス連携は Account API Token（`cfat_`）も可。
