---
name: infra-accounts
description: >-
  Bananacraft インフラ資格情報と Tailscale Docker サイドカー。GSM cursor-secret、
  ~/.cursor/.env の Tailnet 鍵。リポジトリ flll/skills で git 同期。Tailscale、
  Cloudflare、GCP、GitHub、make up-tailscale、SSH マルチホストで使う。
---

# infra-accounts

## Skills の同期（GitHub: flll/skills）

正本は **private リポジトリ** https://github.com/flll/skills （clone 先: `~/.cursor/skills-repo`）。

```bash
cd ~/.cursor/skills-repo && git pull
./scripts/link-skills.sh
```

Bananacraft から: `make skills-sync`

編集後: `git add -A && git commit && git push`（**Bananacraft には Skills をコミットしない**）

## 秘密の正本

| 種類 | 場所 |
|------|------|
| API トークン等 | GCP **`cursor-secret`**（`lll-fish`）→ `~/.cursor/secrets/secret.env` |
| Tailnet 鍵 | **`~/.cursor/.env`** |
| 非機密 | Bananacraft `infra/config.yaml` |

```bash
./infra/scripts/load-secrets-gcp.sh   # Bananacraft リポジトリ内
```

## Bananacraft + Tailscale

- タグ: **tag:bananacraft** のみ
- 起動: `make down` → `make up-tailscale`
- `TS_AUTHKEY` を `~/.cursor/.env` に（空なら `make tailscale-keys`）

## GitHub

- **`gh auth login`** で認証（`GITHUB_TOKEN` は secret.env / GSM に載せない）
- `git push` / `gh pr` / `make skills-sync` は gh の credential を使用

## 禁止

秘密を git / チャットに載せない。`secret.env` を flll/skills にコミットしない。

詳細: [reference.md](reference.md)
