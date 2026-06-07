---
name: git-dev-workflow
description: >-
  新規プロジェクト・フォーク開発開始時に必ず Git ブランチ戦略をユーザーへ確認する。
  main 直開発（trunk）か feature branch か、PR 用 cherry-pick かを決めてから実装する。
  Use when starting a new project, fork, repo setup, git workflow, branching strategy,
  cherry-pick PR, or when the agent would otherwise choose a branch model without asking.
---

# git-dev-workflow

**エージェントがブランチ戦略を独断で決めない。** 別プロジェクトごとに合う合わないがあるため、実装・ブランチ作成・コミット方針に入る前に **init 質問** でユーザーに選ばせる。

[cursor-workflow](../cursor-workflow/SKILL.md) のコミット・push ルールと併用する。ブランチ**戦略**は本スキルが優先。

## いつ init 質問するか（必須）

次のいずれかに該当し、**まだ当該リポジトリで戦略が決まっていない**ときは、コード変更・ブランチ作成・プラン実行の**前**に質問する。

- 新規プロジェクト／新規 clone 後の最初の実装
- フォークを独自開発ラインとして育てる宣言
- ユーザーが「ブランチ」「workflow」「fork」「main で開発」等に言及
- エージェントが feature branch を切ろうとしているが方針未確認

**既に `.cursor/git-dev-workflow.json` または会話で戦略が確定している**場合は再質問しない（ユーザーが「方針変更」と言ったら再実施）。

## init 質問（AskQuestion で実施）

**必ず `AskQuestion` ツールを使う。** テキストだけで代用しない。

### Q1: ブランチ戦略（必須）

| ID | ラベル | 意味 |
|----|--------|------|
| `trunk-main` | main 直開発（推奨: ソロ・フォーク単独・agent 主体） | 日常は `main` にコミット。PR が必要なときだけ cherry-pick で枝を**事後**生成 |
| `short-feature` | 開発しながら短命 feature branch | タスクごとに branch → merge。寿命は原則 1〜2 日 |
| `long-feature` | 機能完成まで feature branch に閉じる | 完成後に main へ merge。実験・大規模変更向け（放置禁止） |

### Q2: upstream / フォーク関係（必須）

| ID | ラベル | 意味 |
|----|--------|------|
| `fork-solo` | フォーク単独開発（upstream PR しない） | `origin/main` が開発 trunk。upstream は読み取り専用 |
| `fork-with-pr` | フォークから upstream に PR する | 開発は trunk または feature。PR 用 branch は cherry-pick または topic branch |
| `upstream-direct` | upstream 本体に直接寄稿（write 権限あり） | GitHub Flow: topic branch + PR が基本 |
| `standalone` | upstream なし（自前 repo のみ） | リモートは `origin` のみ |

### Q3: コミット粒度（任意・未回答時はデフォルト適用）

| ID | ラベル | デフォルト |
|----|--------|------------|
| `atomic` | 1 コミット = 1 目的（cherry-pick しやすい） | **trunk-main / fork-with-pr で推奨** |
| `wip-ok` | WIP コミット可（後で squash） | short-feature で可 |

質問が 3 つ重い場合は Q1+Q2 のみでもよい。Q3 は戦略から推論して提案し、ユーザーが訂正できるようにする。

## 戦略ごとのエージェント行動

### `trunk-main`（main 直開発）

- 通常作業: `git checkout main` のまま実装・コミット
- **feature branch を習慣的に切らない**
- 不確実な実験のみ `experiment/<名前>`（**数日以内**に merge または削除）
- upstream PR (`fork-with-pr`): 完成後にのみ:

```bash
git fetch upstream
git checkout -b pr/<topic>-onto-upstream upstream/main
git cherry-pick -x <hash1> <hash2>   # main 上の意味あるコミットだけ
git push -u origin pr/<topic>-onto-upstream
```

- コミット: WIP 禁止。`feat:` / `fix:` / `chore:` / `docs:` プレフィックス
- 節目で annotated tag（例: `v0.2.0`）を提案

### `short-feature`（開発しながら branch）

- タスク開始: `git checkout -b fix/<topic>` 等（短命）
- 完了後: main へ merge（`--no-ff` 可）、branch 削除
- **1 週間以上放置しない**（週末ブランチ anti-pattern を避ける）

### `long-feature`（完成まで branch）

- 大規模・不確実な変更向け
- main を壊さない中間状態を branch に閉じ込める
- merge 前に rebase/squash をユーザーと相談
- agent は「何日で merge するか」を確認する

### `fork-solo`

- upstream への PR・push は**しない**（ユーザー明示時のみ）
- `git fetch upstream` は有用な修正の確認用。無条件 merge は避ける

## エージェントがやってはいけないこと

- ユーザー無断で「このプロジェクトは main 直が良さそう」と決めて branch を切る／切らない
- trunk-main なのに毎タスク `feature/*` を作る
- WIP だらけの main にしてから cherry-pick を困らせる
- Path A / Path B のように**実装が二重**になる branch を並行維持する
- 週末 branch を放置する

## 戦略の記録（推奨）

init 回答後、リポジトリに記録すると再質問を減らせる:

```json
// .cursor/git-dev-workflow.json（任意・git にコミット可）
{
  "branching": "trunk-main",
  "upstream": "fork-solo",
  "commits": "atomic",
  "decidedAt": "2026-06-06"
}
```

agent はファイルがあれば読み、なければ init 質問する。

## 他スキルとの関係

| スキル | 役割 |
|--------|------|
| **git-dev-workflow**（本スキル） | ブランチ戦略の init 質問と運用 |
| cursor-workflow | プラン絵文字、日本語 commit、push 禁止（アプリ） |
| infra-secrets | 秘密情報 |

詳細・調査根拠: [reference.md](reference.md)
