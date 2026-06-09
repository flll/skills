---
name: cursor-canvas-runtime
description: >-
  Cursor IDE 同梱 canvas-runtime を Extract-and-rehost する runtime-vendor プロファイル。
  kusanali Canvas（OpenClaw）実績。sync-runtime・51 シンボル re-export・React shim・esbuild external。
---

# cursor-canvas-runtime — runtime-vendor の Cursor Canvas プロファイル

本 Skill は [runtime-vendor](../runtime-vendor/SKILL.md) の **Cursor IDE `canvas-runtime.esm.js`** ドメインプロファイル。
汎用 5 層・禁止事項・テンプレートは runtime-vendor を参照。

- プロファイル（パス・シンボル・パイプライン）: [profile.md](profile.md)
- OpenClaw 実装参照: [reference.md](reference.md)

## 🎯 ゴール

kusanali.lll.fish v2 Canvas は **Cursor 同梱ランタイムをそのままブラウザ配信**する。独自 UI 再実装はしない。

## 🔧 クイックスタート（OpenClaw）

```bash
# vendor 同期（IDE 必須）
oc canvas sync-runtime
# または
node scripts/sync-cursor-canvas-runtime.mjs

# ビルド・検証
cd services/kusanali-web
npm run build
oc canvas publish --sample-v2
```

同期失敗時はビルドが止まる。**独自 Canvas UI へ黙ってフォールバックしない。**

## 📌 5 層マッピング

| 層 | Cursor Canvas での実体 |
|----|------------------------|
| Discover | `%LOCALAPPDATA%\Programs\cursor\...\canvas-runtime\canvas-runtime.esm.js` |
| Sync | `services/kusanali-web/vendor/cursor-canvas-runtime/`（gitignore） |
| Introspect | `exports.json`（51 シンボル）+ `types/cursor/canvas/*.d.ts` |
| Shim | `canvas-react-shim.mjs` / `canvas-jsx-runtime-shim.mjs` + `__cursorCanvas` テーマ |
| Rehost | `/assets/canvas-runtime.js` + esbuild `bundle.mjs` → Worker R2 |

## ⚠️ 禁止

- プロプライエタリ `canvas-runtime.esm.js` を **flll/skills や git にコピーしない**
- 同期なしで publish / build を通さない
- 型・コンポーネントの手書き再実装

## ✅ 検証

1. `canvas-sdk-version` が IDE と一致していること
2. IDE 横パネル `.canvas.tsx` と `https://kusanali.lll.fish/canvas/...` を同一データで比較
3. `verifyRuntimeExports` が 51 シンボルすべて OK

詳細: [profile.md](profile.md)
