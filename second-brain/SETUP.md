# second-brain セットアップ — skills と brain の一心同体

## 関係

- **flll/skills (PUBLIC)** = エンジン(本 Skill, フック, 手順)
- **flll/brain (PRIVATE)** = データ(PROFILE, prompts, 蒸留ノート)

片方だけでは第二の脳として成立しない。

## 1. brain を clone(初回・新マシン)

```powershell
gh repo clone flll/brain $env:USERPROFILE\brain
```

## 2. skills を同期

```bash
~/.cursor/skills-repo/scripts/sync-skills.sh
~/.cursor/skills-repo/scripts/verify-skills.sh
```

## 3. プロンプト捕捉フック(自動)

`~/.cursor/hooks.json` に以下が入っていること(初回セットアップで agent が作成):

- `beforeSubmitPrompt` → `capture-prompt.mjs`(全プロンプトを `~/brain/prompts/` へ)
- `sessionEnd` → `commit-prompts.mjs`(セッション終了時に brain へ commit/push)

フックの実体: `~/.cursor/skills/second-brain/hooks/`(sync 後のパス)

## 4. User Rule(全プロジェクトで brain を読ませる)

Cursor の `Settings → Rules → User Rules` に追加:

```
セッション開始時、~/brain/ が存在すれば PROFILE.md と INDEX.md を読む。
PROFILE の方針「まずAIが自力で実行し、できない時だけ人に頼む」に従う。
判断・学び・未解決が出たら蒸留して brain に記録する(second-brain skill 準拠)。
brain の内容は外部(公開repo/SNS/チャット外)に出力しない。
```

## 5. ActivityWatch(任意)

```powershell
winget install -e --id ActivityWatch.ActivityWatch
node ~/brain/scripts/aw-daily-summary.mjs
```

## 6. 秘匿(任意)

- 段階2: `brain/secrets/` を SOPS+age で暗号化 → `brain/secrets/README.md`
- 段階3: 最も機微なものは `brain/private-local/`(.gitignore, push しない)

## 7. 複数 PC + 同一 SSH 先（lll-legacy 等）

**正しい分け方**: コードはリモート1か所、記憶は brain で同期、Cursor 設定は各 PC ローカル。

| レイヤ | 置き場所 | 同期方法 |
|--------|---------|---------|
| **コード・git** | SSH 先（lll-legacy）のワークスペース | リモート1台が正本。どの PC からも同じフォルダを開く |
| **第二の脳（brain）** | 各 PC の `~/brain` | `git pull`（開始時）/ フックが `commit+push`（セッション終了時） |
| **skills** | 各 PC の `~/.cursor/skills` | `flll/skills` を bootstrap/sync |
| **チャット履歴** | 各 PC ローカル（Cursor 内部） | **自動同期されない**。重要な判断は brain に蒸留 |
| **フック・User Rules** | 各 PC の `~/.cursor/` | マシンごと。新 PC では SETUP を再適用 |
| **秘密（.env）** | 各 PC の `~/.cursor/.env` | infra-secrets / GSM で各マシンに配布 |

### 推奨フロー（毎セッション）

1. **SSH Remote** で lll-legacy の同じプロジェクトを開く（コードの正本）
2. ローカルで `cd ~/brain && git pull`（他 PC の prompts / 蒸留を取り込む）
3. `PROFILE.md` `INDEX.md` を読んでから作業
4. 終了時: フックが `prompts/` を brain に commit/push → 次の PC で pull すれば揃う

### やらない方がよいこと

- brain を SSH 先だけに置いて、ローカルフックから書こうとする（フックは **Cursor を起動した PC** で動く）
- PC ごとに別ワークスペースを正本にする（どちらが最新か分からなくなる）
- チャット履歴が PC 間で引き継がれる前提で運用する（引き継がれない）

### イメージ

```
[PC-A] ──SSH──┐
[PC-B] ──SSH──┼──> lll-legacy（コード正本）
[PC-C] ──SSH──┘

[PC-A] ~/brain ──git──> flll/brain <──git── [PC-B] ~/brain
         ↑ フックが prompts を書く（ローカル）        ↑
```

**結論**: 複数 PC から同じ SSH 先でチャットするのは正しい使い方。揃えるべきは **リモートのコード** と **brain の git** であり、チャット UI の履歴そのものではない。

