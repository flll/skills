# git-dev-workflow reference

## 調査サマリ（2026-06）

### ソロ・フォーク開発

- [NovVista: Solo Developers](https://novvista.com/git-workflows-for-solo-developers-beyond-the-textbook-branching-strategies/) — ソロでは **main 直コミット** +（可能なら）feature flag が実用的。Gitflow は過剰。
- [Atlassian: Trunk-Based Development](https://www.atlassian.com/continuous-delivery/continuous-integration/trunk-based-development) — 小さく頻繁に trunk へ統合。
- [Mainline.dev](https://mainline.dev/docs/trunk-based-development) — OSS 外部貢献は PR + branch が妥当。信頼できるクローズド／ソロでは長命 feature branch は統合コストだけ増やす。

### upstream 寄稿

- [Git Book: Contributing](https://git-scm.com/book/en/v2/GitHub-Contributing-to-a-Project) — フォークでは topic branch + PR。
- [susam/gitpr](https://github.com/susam/gitpr) — フォークの main は upstream のミラーに保ち、開発は topic branch（upstream PR する場合）。

### cherry-pick で PR branch を後から作る

- [Sebastian Romero Laguna](https://medium.com/@sebastianromerolaguna/the-magic-before-the-pr-cherry-pick-using-git-and-github-4f64efee6cf0) — main（または dev）で開発し、PR 用に clean branch へ cherry-pick。
- [Matt Stauffer: cherry-pick from PR](https://mattstauffer.com/blog/how-to-merge-only-specific-commits-from-a-pull-request/) — 必要なコミットだけ選んで取り込む。

## 比較表

| 観点 | trunk-main（全部できてから branch は PR 時のみ） | short-feature（開発しながら branch） |
|------|-----------------------------------------------|-------------------------------------|
| 向く | ソロ、agent 頻繁コミット、フォーク単独 | レビュー必須、タスク明確で短命 |
| メリット | シンプル、branch 放置がない | main を汚さない |
| デメリット | main のコミット品質が要る | merge 忘れ・長命化リスク |
| PR | cherry-pick で事後生成 | branch をそのまま PR |

## init 質問テンプレ（AskQuestion JSON イメージ）

```json
{
  "title": "Git 開発方針（init）",
  "questions": [
    {
      "id": "branching",
      "prompt": "このリポジトリのブランチ戦略は？",
      "options": [
        { "id": "trunk-main", "label": "main 直開発（PR 時のみ cherry-pick で枝を作る）" },
        { "id": "short-feature", "label": "開発しながら短命 feature branch（1〜2日）" },
        { "id": "long-feature", "label": "機能完成まで feature branch に閉じる" }
      ]
    },
    {
      "id": "upstream",
      "prompt": "upstream / フォークの関係は？",
      "options": [
        { "id": "fork-solo", "label": "フォーク単独（upstream PR しない）" },
        { "id": "fork-with-pr", "label": "フォークから upstream に PR する" },
        { "id": "upstream-direct", "label": "upstream 本体に直接寄稿" },
        { "id": "standalone", "label": "自前 repo のみ（upstream なし）" }
      ]
    }
  ]
}
```

## cherry-pick PR 手順（fork-with-pr + trunk-main）

```bash
git fetch upstream
git log --oneline upstream/main..main    # 送るコミットを選ぶ
git checkout -b pr/<topic>-onto-upstream upstream/main
git cherry-pick -x <hash1> <hash2>
# コンフリクト時: 解消 → git cherry-pick --continue
git push -u origin pr/<topic>-onto-upstream
gh pr create --repo <upstream-owner>/<repo> --base main
```

## 週末ブランチ anti-pattern

習慣で `feature/foo` を切り、数日〜数週 touch しない。main が進み merge が苦痛になる。対策:

- trunk-main を選ぶ
- または branch に**個人デッドライン**（2 日以内 merge or 破棄）

## atomcam_tools での適用例（flll フォーク）

- branching: `trunk-main`
- upstream: `fork-solo`
- commits: `atomic`
- 初回のみ: `chore/upgrade-build-env-ubuntu2604` + `feature/integrated-fixes` を main に統合
- 以降: main のみ。`pr/tailscale/*` / `feature/tailscaled` は archive
