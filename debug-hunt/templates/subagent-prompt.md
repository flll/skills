# サブエージェント委譲プロンプト雛形

親エージェントが Task ツールで readonly サブエージェントを起動するときに使う。
`{{PLACEHOLDER}}` を埋めてコピーする。

---

## Task ツール引数

```
subagent_type: generalPurpose  # または explore
readonly: true
description: {{SHORT_DESCRIPTION}}  # 6語以内
```

## プロンプト本文（`prompt` に貼る）

```
あなたは readonly 調査サブエージェントです。fix の実装・コミットは禁止。
ユーザーに本番操作を依頼しないでください。

## 読む資料（全文を最初に読む）

- 汎用フレームワーク: {{DEBUG_HUNT_SKILL_PATH}}
- ドメインプロファイル: {{DOMAIN_PROFILE_PATH}}
- ドメイン Skill: {{DOMAIN_SKILL_PATH}}

## 仮説（判定して返す）

{{HYPOTHESIS_LIST}}
# 例: H1, H2, H3 — 各々 CONFIRMED / REJECTED / INCONCLUSIVE

## ログ・出力先

- 計装ログ: {{TRACE_LOG_PATH}}
- watchdog ログ: {{WATCHDOG_LOG_PATH}}
- スナップショット出力: {{SNAPSHOT_DIR}}

## 手順

1. ベースライン計測（snapshot-metrics またはドメイン固有スクリプト）
2. 再現シナリオを能動実行（profile.md の代替経路のみ）
3. 事後スナップショット + ログ相関
4. 各仮説を CONFIRMED / REJECTED / INCONCLUSIVE で判定
5. watchdog が ABORT した場合は再現を中断し、ABORT ログを証拠に含める

## 禁止事項

- fix コミット・コード修正
- ユーザーへの本番再現依頼
- 調査レポート以外の成果物

## 成果物（調査レポートのみ）

1. 再現手順と成否
2. 仮説判定表（CONFIRMED / REJECTED / INCONCLUSIVE）
3. 根本原因 1–3 件 + 証拠ログパス
4. 次フェーズ fix 案（実装しない）
```

## 埋め方チェックリスト

- [ ] Skill / profile の絶対パスを指定した
- [ ] 仮説 ID リストを列挙した
- [ ] ログパス・スナップショット先を指定した
- [ ] `readonly: true` を設定した
