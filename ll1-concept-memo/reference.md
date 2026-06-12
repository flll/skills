# ll1-concept-memo — エントリテンプレート

## ファイル先頭（新規 `docs/LL1-CONCEPT-MEMO.md` のみ）

```markdown
# ll1 のコンセプトへの考え

エージェントが当座解消できなかった問題の備忘録。将来の LLM・論文・再リファクタのフィードバックループ用。
Skill: [ll1-concept-memo](https://github.com/flll/skills/tree/main/ll1-concept-memo)

---

```

## エントリ 1 件

```markdown
## ll1-YYYYMMDD-<slug>

| 項目 | 内容 |
|------|------|
| **phase** | phase6 |
| **status** | open |
| **created** | YYYY-MM-DD |
| **last-reviewed** | — |
| **project** | `<repo or product name>` |

### 要約

（1 文）

### 症状

- （ユーザーが観測した事象）
- （関連 ID: Discord message ID、issue #、ログパス）

### 再現条件

- （環境・入力・前提）

### 試したこと

- [ ] （調査・修正の試行と結果）

### 仮説

1. （最有力）
2. （次点）

### TODO

- [ ] （後続作業。優先度順）

### ll1 メモ

> この問題の解消はループされ、ll1 がもっとも注力している機能、フィードバック。
> 将来高性能な LLM や新論文が提唱されたとき、再リファクタの材料とする。

---
```

## status 更新（解消時）

同エントリ末尾に追記:

```markdown
### 解消

- **resolved**: YYYY-MM-DD
- **fix**: （コミット hash または PR URL）
- **notes**: （根因と対策の 1〜2 文）
```

`status` 行を `open` → `resolved` に書き換える。
