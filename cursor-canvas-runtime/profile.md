# cursor-canvas-runtime profile

> 汎用フレーム: [runtime-vendor/SKILL.md](../runtime-vendor/SKILL.md)
> OpenClaw ファイル対応: [reference.md](reference.md)

## 症状・トリガー

- Cursor Canvas（`.canvas.tsx`）と同等 UI を Web で配信したい
- `import from 'cursor/canvas'` をブラウザバンドルで解決したい
- IDE 更新後に Canvas の見た目や export がずれた

## Discover — アーティファクトパス

| OS | 既定パス |
|----|----------|
| Windows | `%LOCALAPPDATA%\Programs\cursor\resources\app\extensions\cursor-agent-exec\dist\canvas-runtime\canvas-runtime.esm.js` |
| 型定義 | `...\dist\agent-sdk\cursor\canvas\*.d.ts` |
| バージョンピン | `...\dist\agent-sdk\canvas-sdk-version` |

環境変数: `CURSOR_CANVAS_RUNTIME_PATH`（ファイル直接指定）

## Sync — ベンダー出力

```
services/kusanali-web/vendor/cursor-canvas-runtime/   # gitignore
  canvas-runtime.esm.js      # ~1.5MB ESM（React 19 同梱、re-export パッチ済）
  canvas-sdk-version         # IDE ピンハッシュ
  canvas-runtime.esm.js.LICENSE.txt  # あれば
  types/cursor/canvas/*.d.ts
  types/cursor/package.json  # "./canvas" types 解決用
  exports.json               # 51 シンボル + patchedAt
```

コマンド:

```bash
oc canvas sync-runtime
node scripts/sync-cursor-canvas-runtime.mjs
```

同期処理の要点:

1. `canvas-runtime.esm.js` をコピーし、末尾 `export{...}` に **51 シンボル** を追加
2. `dist_exports={}` パターンの存在を検証（フォーマット変更検知）
3. agent-sdk の型と `canvas-sdk-version` をコピー

## Introspect — 51 re-exported symbols

`exports.json` に記録される `cursor/canvas` 再エクスポート（51 個）:

| カテゴリ | シンボル |
|----------|----------|
| レイアウト | `Row`, `Stack`, `Grid`, `Spacer`, `Divider` |
| タイポ | `H1`, `H2`, `H3`, `Text`, `Code`, `Link` |
| 入力 | `Button`, `IconButton`, `TextInput`, `TextArea`, `Select`, `Checkbox`, `Toggle` |
| 表示 | `Card`, `CardHeader`, `CardBody`, `Badge`, `Chip`, `Pill`, `Tag`, `Callout`, `Stat`, `Table`, `CollapsibleSection`, `TodoList`, `TodoListCard`, `DiffView`, `DiffStats`, `UsageBar`, `Swatch` |
| チャート | `BarChart`, `LineChart`, `PieChart` |
| トークン | `canvasPaletteDark`, `canvasPaletteLight`, `canvasTokens`, `canvasTokensLight`, `categoryPaletteDark`, `categoryPaletteLight`, `colorPalette`, `usageColorSequence` |
| ユーティリティ | `mergeStyle`, `computeDAGLayout` |
| Hooks | `useCanvasAction`, `useCanvasState`, `useHostTheme` |

検証: `services/kusanali-web/lib/introspect-runtime.mjs` の `verifyRuntimeExports()`

## Shim — Host shim パターン

### React / jsx-runtime

ランタイムが `mountCanvas` 時に `globalThis.React` をセットする前提。

- `canvas-react-shim.mjs` — `export default globalThis.React`（未設定なら throw）
- `canvas-jsx-runtime-shim.mjs` — `jsx` / `jsxs` / `Fragment` を React に委譲

### esbuild external（compile-canvas.mjs）

| import | 解決先 |
|--------|--------|
| `cursor/canvas` | `/assets/canvas-runtime.js`（external） |
| `react` | `/assets/canvas-react-shim.mjs` |
| `react/jsx-runtime` | `/assets/canvas-jsx-runtime-shim.mjs` |

### テーマ

`prefers-color-scheme` → `window.__cursorCanvas.state.theme`（bootstrap で注入）

## Rehost — 配信パイプライン

| 資産 | URL | 説明 |
|------|-----|------|
| ランタイム | `/assets/canvas-runtime.js` | vendor からコピー |
| Bootstrap | `/assets/bootstrap.js` | テーマ shim + `mountCanvas` |
| Canvas 本体 | `/canvas/{slug}/bundle.mjs` | publish 時 esbuild コンパイル |

### publish パイプライン（ll1 / v2）

1. `document.json` 検証（schema v2）
2. `generate-canvas-tsx.mjs` → `.tsx`（`import from 'cursor/canvas'`）
3. `compile-canvas.mjs`（esbuild）→ `bundle.mjs`
4. `POST /api/canvas` に `bundleMjs` + `tsxSource`
5. Worker が R2 に `document.json` / `bundle.mjs` / `source.canvas.tsx` を保存

v1（prose のみ）は従来どおり静的 `index.html`。

## 閾値・失敗時

| 条件 | 動作 |
|------|------|
| IDE 未インストール / パス不明 | 同期スクリプトが throw、ビルド停止 |
| `dist_exports` / export 行フォーマット変更 | パッチ失敗で throw（手動更新が必要） |
| export 欠落 | `verifyRuntimeExports` が throw |
| Cursor 更新後 | `oc canvas sync-runtime` で `canvas-sdk-version` 再確認 |

## 法的・運用

| 項目 | 方針 |
|------|------|
| ライセンス | Cursor プロプライエタリ — **git 非コミット** |
| 再配布 | 自 Worker Assets 経由のブラウザ配信のみ |
| skills リポジトリ | バイナリ・vendor は **含めない**（手順とテンプレのみ） |
