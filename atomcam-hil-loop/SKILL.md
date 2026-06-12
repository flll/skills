---
name: atomcam-hil-loop
description: >-
  ATOMCam 実機テスト・deploy して確認・HIL ループ・起動テスト自動化・atomcam デプロイ・
  スモークテストの依頼時に使う。atomcam_tools の make deploy-test を駆動して
  「ビルド → 実機デプロイ → 起動テスト → 失敗解析 → 修正 → 再ループ」を自律実行する。
  汎用調査フレームは debug-hunt に委譲する二層構成のドメインプロファイル。
---

# atomcam-hil-loop — ATOMCam 実機 HIL（Hardware-In-the-Loop）自律ループ

本 Skill は [debug-hunt](../debug-hunt/SKILL.md) の **ATOMCam 実機デプロイ・起動テスト** ドメインプロファイル。
汎用の調査原則・親/サブエージェント手順は debug-hunt を参照。実行基盤は `atomcam_tools` リポジトリの
`make deploy-test`（`scripts/deploy_remote.sh` + `scripts/smoke_test_remote.sh`）。

- 失敗パターン辞書・exit code 表・NDJSON 形式: [reference.md](reference.md)
- 実機側の復旧手順: atomcam_tools の `docs/development/remote-deploy.md`

## 前提

- 作業ディレクトリ: `~/atomcam_tools`（flll/atomcam_tools フォーク、main 直コミット）
- 実機: `atomcam33`（SSH 到達可能であること）。デプロイは `/media/mmc/update/` 経由の
  サイズ検証付き更新パスのみ使用（SD 抜き差しゼロ）
- コミット規約は [cursor-workflow](../cursor-workflow/SKILL.md)（日本語、`fix:` prefix。
  atomcam_tools への push はユーザー明示時のみ）

## 自律ループ手順

```
make build → make deploy-test → 成功なら報告終了
                  │ 失敗
                  ▼
   sim-results/deploy-<timestamp>/ のログ解析
                  ▼
   原因仮説（debug-hunt フレームに委譲）→ reference.md の辞書で切り分け
                  ▼
   修正 → fix: コミット（日本語）→ ループ先頭へ（最大 3 反復）
```

1. **現行版を控える** — ループ開始時に `./scripts/deploy_remote.sh atomcam33 --status` で
   実機の現行バージョンを記録（ロールバック判断の基準）
2. **`make build`** — 失敗したらデプロイせず、ビルドログ解析へ
3. **`make deploy-test`** — exit code（0/10/20/30）と stdout の NDJSON を解析
   （意味は [reference.md](reference.md) の表を参照）
4. **成功（exit 0 + 全ケース pass）** — NDJSON サマリを添えて報告し終了
5. **失敗** — `sim-results/deploy-*/` に自動収集された `atomhack.log` / `dmesg` / `ps` /
   `/tmp/hack.ini` を読み、[reference.md](reference.md) の失敗パターン辞書で一次切り分け。
   深掘りが必要なら debug-hunt の仮説→計装→再現フレームに委譲
6. **修正コミット** — 原因に対する最小修正を `fix:` prefix の日本語コミットで残し、手順 2 へ

## 安全境界（3 層・厳格）

### Always（常に守る）

- 反復ごとに NDJSON 結果（exit code・ケース別 pass/fail・反復番号）を記録に残す
- 実機側 `.bak` バックアップ（`/media/mmc/rootfs_hack.squashfs.bak`）の作成を
  確認できた deploy のみ実行する（deploy_remote.sh が自動作成。ログで確認）
- ループ開始時に `--status` で実機の現行版を控える

### Ask first（ユーザーに確認してから）

- **最大 3 反復** で停止し、結果サマリと残課題をユーザーへ報告する
- `initramfs_skeleton/` / `patches/kernel/` / u-boot 関連に踏み込む修正
  （起動不能リスクが高い領域）
- `--rollback` の実行（`.bak` を書き戻して reboot）

### Never（禁止）

- SPI フラッシュの書き換え（純正 u-boot / 純正カーネル領域には一切触れない）
- `/media/mmc/rootfs_hack.squashfs` への直接上書き（initramfs のサイズ検証を回避する行為。
  更新は必ず `/media/mmc/update/` 経由）
- 4 回目以降の無断反復（3 反復で必ず停止・報告）
- ユーザー不在時の電源系操作（スマートプラグ・物理電源断の指示等）

## 実機が unreachable の場合

ping / ssh が通らない場合（電源 OFF 等）は **リトライせず 1 回で諦めて報告** する
（Automation からの定期起動を前提とするため、待ち続けない）。報告には
最終確認時刻と試行したホスト名を含める。

## 他スキルとの関係

- 汎用の調査フレーム（仮説表・計装・readonly サブエージェント委譲）→ **debug-hunt**
- コミット規約・push ポリシー（flll/skills のみ能動 push 可）→ **cursor-workflow**
- 実行基盤スクリプトの仕様・復旧手順 → atomcam_tools `docs/development/remote-deploy.md`
