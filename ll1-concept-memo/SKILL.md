---
name: ll1-concept-memo
description: >-
  エージェントが当座解消できない問題を「ll1のコンセプトへの考え」として構造化備忘録に残す。
  /ll1-memo または phase6・未解決・備忘録・フィードバックループ・将来再リファクタの依頼時に使う。
  kusanali 以外のプロジェクトでも /loop と同様にスラッシュ呼び出し可能。
---

# ll1-concept-memo — 未解決問題の備忘録（ll1 フィードバックループ）

エージェントが **当座に解消できなかった問題** を、プロジェクト横断で再利用できる備忘録として残す Skill。
[/loop](https://github.com/flll/skills)（Cursor 同梱 `loop` skill）が **定期実行** を担うのに対し、本 Skill は **知識の蓄積と将来の再挑戦** を担う。

## ll1 のコンセプト（原文）

> phase6
> また、この要望、あなたというエージェントがうまく解消できなかった保険として、この問題をドキュメントで下記示して、備忘録として「ll1のコンセプトへの考え」としてください。TODOとしてあとからやります
> この問題の解消はループされ、ll1がもっとも注力している機能、フィードバックなので、将来高性能なLLMや、新論文が提唱されたとき、それらに再リファクタリングを行い、モダンな構成を維持するために活用されます

## Parse

`/ll1-memo [phaseN] <problem summary>`

- 先頭 phase: `/ll1-memo phase6 Discord 無反応`
- phase 省略: `/ll1-memo ビルドが Windows で再現しない`
- 空プロンプト: `Usage: /ll1-memo [phaseN] <problem summary>`

エージェントが自力で解消できず、ユーザーに「後でやる」と約束する場合も **能動的に** 本 Skill を適用する（ユーザーが `/ll1-memo` と打たなくてよい）。

## 配置（プロジェクトごと）

| 優先 | パス | 用途 |
|------|------|------|
| 1 | `docs/LL1-CONCEPT-MEMO.md` | 正本（1 ファイルに追記） |
| 2 | `docs/ll1-concept/` | エントリが多い場合は `YYYY-MM-DD-<slug>.md` に分割 |
| 3 | プロジェクト慣習の `docs/` | 上記が無い場合は最も近い docs ディレクトリ |

**既存ファイルがあれば追記**。新規作成時は [reference.md](reference.md) のテンプレートを使う。

## 手順

1. **問題を 1 文で要約** — ユーザー依頼または失敗したタスクから抽出
2. **エントリ ID を付与** — `ll1-YYYYMMDD-<slug>`（同日複数は `-2` 等）
3. **テンプレートに沿って記録** — 症状・再現条件・試したこと・仮説・TODO・関連 ID（Discord msg ID、CI run、ログパス等）
4. **status: open** で保存 — 解消したら同エントリに `status: resolved` と日付を追記（削除しない）
5. **ユーザーへ短く報告** — 備忘録パス、エントリ ID、TODO の要点のみ

## 将来ループ（/loop との連携）

未解決エントリを **定期的に再評価** したいとき:

```bash
# 例: 週次で open エントリを棚卸し
/loop 7d /ll1-memo review-open — docs/LL1-CONCEPT-MEMO.md の status:open を読み、解消可能か再調査
```

`/ll1-memo review-open` は固定プロンプトとして扱う:

1. `docs/LL1-CONCEPT-MEMO.md`（または `docs/ll1-concept/`）を読む
2. `status: open` のエントリごとに、新しい LLM 能力・ライブラリ・論文・コード変更で解消可能か判断
3. 解消可能なら着手（ユーザーが別途禁止していなければ）
4. まだ不可なら仮説・TODO を更新し `last-reviewed: YYYY-MM-DD` を追記

## エージェント自律適用のトリガ

次のいずれかで **能動的に** 本 Skill を読み、備忘録を残す:

- 同一問題が **2 回以上** 再発した
- 調査・修正を試したが **このセッション内で完遂できない** と判断した
- ユーザーが phase6 / ll1 / 備忘録 / 後でやる / フィードバックループ と言及した
- [debug-hunt](../debug-hunt/SKILL.md) を 3 ラウンド以上回しても根因が確定しない

## 禁止

- 秘密・トークン・個人情報を備忘録に平文で書かない（パス・ID のみ）
- 解消済みエントリを削除しない（履歴として残す）
- 備忘録作成で **問題の調査自体を打ち切らない** — 記録は調査の最後の一手、最初の一手ではない

## 関連 Skill

| Skill | 関係 |
|-------|------|
| [debug-hunt](../debug-hunt/SKILL.md) | 調査フレーム（本 Skill は調査不能時の出口） |
| loop（Cursor 同梱） | 定期再評価の wake 機構 |
| [cursor-workflow](../cursor-workflow/SKILL.md) | 備忘録のみ commit 可。fix 本体は別コミット |
