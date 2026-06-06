# <domain>-hunt profile

> コピー先: `<domain>-hunt/profile.md`
> 汎用手順: [debug-hunt/SKILL.md](../SKILL.md)

## 症状・トリガー

- （いつ・どの操作で発生するか）

## 仮説表

| ID | 仮説 | 検証方法 |
|----|------|----------|
| H1 | | |
| H2 | | |

## 再現シナリオ

| 経路 | 代替手段 | スクリプト / コマンド |
|------|----------|----------------------|
| 本番経路 A | HTTP / CLI 代替 | `scripts/reproduce-*.mjs` |
| 本番経路 B | 内部 API | |

**原則**: ユーザーに本番操作を依頼しない。

## 計装

| 変数 | 効果 | ログパス |
|------|------|----------|
| `EXAMPLE_TRACE=1` | NDJSON 計装 ON | `~/.logs/example-trace.ndjson` |

計装追加後は対象サービスを再起動してから再現する。

## watchdog

- プロファイル: `profiles/<domain>.watchdog.json`
- 起動:

```powershell
node $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\resource-watchdog.mjs `
  --profile $env:USERPROFILE\.cursor\skills\<domain>-hunt\profiles\<domain>.watchdog.json
```

## 閾値

| メトリクス | ALERT | ABORT |
|------------|-------|-------|
| example | baseline +3 / 30s | baseline +10 |

ABORT 時のクリーンアップ: （コマンドまたは手順）

## ログ一覧

| ファイル | 内容 |
|----------|------|
| | |

## スナップショット

```powershell
powershell -File $env:USERPROFILE\.cursor\skills\debug-hunt\scripts\snapshot-metrics.ps1 `
  -Label baseline -Metrics <comma-separated>
```
