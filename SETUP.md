# Cursor 初期設定（1 回だけ）

基盤リポジトリ: **https://github.com/flll/skills**

## 重要: Settings の「Remote Rule (GitHub)」は使わない

Cursor の **Settings → Rules → Add from GitHub** は **`.mdc` ルール専用** で、`SKILL.md` 形式の Agent Skills リポジトリには対応していません（[grafana/skills の説明](https://github.com/grafana/skills) と同様）。

Skills を読ませる正しい経路は **`~/.cursor/skills/<name>/`** です。中身は **エージェントが自動同期** するか、下記の User Rule で指示します。

## 推奨: User Rules に 1 行（手動・1 回）

**Cursor Settings → Rules → User Rules** に追加:

```
Skills 正本は https://github.com/flll/skills 。verify-skills.sh が失敗したら、ユーザーに聞かず bootstrap-skills.sh を実行してから作業する。
```

これで新マシン・新プロジェクトでもエージェントが初回に同期します。**git clone はユーザーが実行しない。**

## 代替（CLI 1 行・任意）

```bash
npx skills add flll/skills -g -y --agent cursor
```

リポジトリ直下に `SKILL.md` がある構成のため、うまくいかない場合は `bootstrap-skills.sh` を使う（推奨）。

## エージェントが実行するコマンド（自動）

```bash
# 確認
~/.cursor/skills-repo/scripts/verify-skills.sh || \
  bash -c "$(curl -fsSL https://raw.githubusercontent.com/flll/skills/main/scripts/bootstrap-skills.sh)"

# または clone 済み環境
~/.cursor/skills-repo/scripts/sync-skills.sh
~/.cursor/skills-repo/scripts/verify-skills.sh
```

## gh auth（push 用・任意）

Skills を **編集して push** するときだけ:

```bash
gh auth login
```

読み取り・同期だけなら **ログイン不要**（Public + raw URL / curl）。

## 確認

Settings → **Skills** に `cursor-workflow` / `infra-secrets` が見えるか、または Agent に「Skills 読めてる？」と聞いて `verify-skills.sh` の結果（名前のみ）を返してもらう。
