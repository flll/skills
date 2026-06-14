---
name: second-brain
description: >-
  ユーザーの第二の脳(brain リポジトリ)を読み書きする手順。3層メモリ(Raw/Permanent/Core)の
  蒸留と Reflection ループを担う。第二の脳・INDEX・PROFILE・蒸留・棚卸し・わからないこと・
  decisions・permanent・open・prompts に言及したとき、またはセッション開始時に使う。
  brain が無いと第二の脳として成立しない。エンジン(skills)とデータ(brain)は一心同体。
---

# second-brain — 第二の脳の読み書き

**エンジン(本 Skill, flll/skills) + データ(`~/brain`, flll/brain private) = 一心同体。**
片方だけでは成立しない。brain が無い場合は `gh repo clone flll/brain ~/brain` を提案する。

由来: Progressive Summarization(Tiago Forte) / MemGPT 階層メモリ / Reflexion 振り返り。

## セッション開始時(必ず)

1. `~/brain/PROFILE.md` と `~/brain/INDEX.md` を読む(Layer3 = core memory)。
2. brain が無ければ clone を提案し、読み取りはスキップ。
3. PROFILE の「エージェントへの期待」を最優先で守る:
   **まず自力で実行。できない時だけユーザーに頼む。**

## 3層メモリ(どこに何を書くか)

| 層 | 場所 | 書くもの | 禁止 |
|----|------|---------|------|
| Layer1 Raw | `prompts/` `daily/` / 外部生ログ | ユーザープロンプト全文・ActivityWatch 数値 | agent-transcripts への重複コピー不要(フックが prompts/ に集約) |
| Layer2 Permanent | `permanent/` `decisions/` `open/` | 蒸留したアトミックノート | 一度に全部要約しない |
| Layer3 Core | `INDEX.md` `PROFILE.md` | 人物像・わからないこと | 肥大化させない(要点のみ) |

## プロンプト蓄積(自動)

`~/.cursor/hooks.json` の `beforeSubmitPrompt` フックが、ユーザーが Cursor に送った
**すべてのプロンプト**を `~/brain/prompts/YYYY-MM-DD.jsonl` に追記する。
ユーザーの性格・思考のアウトプットは貴重なコンテキスト。蒸留の原料として扱う。

## 蒸留の手順(Progressive Summarization)

**原則: 触れたときだけ蒸留する。** 全ログを要約しようとしない(破綻する)。

1. `prompts/` や会話から、再利用価値のある点だけ抜く。
2. `permanent/YYYYMMDD-<slug>.md` に **1ノート1アイデア**で書く。フォーマット:
   - 1行サマリ(executive summary)
   - 判断(decision): 何をどう決めたか
   - 学び(learning): 次に活きる教訓
   - 未解決(open): 残った問い 最大3行
   - 原文リンク(source): `prompts/` または agent-transcripts への参照
3. 判断主体のものは `decisions/`、未解決主体は `open/`(ll1形式)へ。

## Reflection ループ(週次・Layer2 → Layer3 抽象化)

`/loop` 等で週1回:

1. 直近の `permanent/` `decisions/` `prompts/` を読み、繰り返し現れるパターンを抽出。
2. 価値観・癖レベルに昇格できるものを `PROFILE.md` に**短く**反映。
3. `INDEX.md` の open 項目を再評価。解決可能なら着手。
4. semantic drift 対策: 要約で意味が痩せていないか、原文リンクと照合。

## フィードバックの拾い方(重要)

ユーザーが「こうであってほしい」「こうしてほしい」と述べたら、依頼の遂行とは別に、
その**要望自体**を `PROFILE.md`(恒久的傾向)か `decisions/`(一回的判断)に記録する。

## 禁止

- brain 内容を外部(公開repo/SNS)に出力しない(private repo 内の運用のみ)。
- 秘密・トークンを平文で置かない([infra-secrets] 管轄)。
- skills 以外の push はユーザー明示時のみ。ただし `prompts/` の自動 commit はユーザー承認済み。

## セットアップ

初回・マルチマシン同期は [SETUP.md](SETUP.md) を参照。
