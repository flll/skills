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
