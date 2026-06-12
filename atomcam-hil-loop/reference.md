# atomcam-hil-loop reference

失敗パターン辞書・exit code 表・NDJSON 形式。手順本体は [SKILL.md](SKILL.md)、
汎用調査フレームは [debug-hunt](../debug-hunt/SKILL.md)。

## exit code 表（deploy_remote.sh / make deploy-test）

| code | 意味 | 一次対応 |
|------|------|----------|
| 0 | 成功（デプロイ + 版一致） | smoke test の NDJSON を確認して報告 |
| 10 | 転送失敗（scp / ssh 不通） | unreachable 扱い。1 回で諦めて報告 |
| 20 | 起動タイムアウト（ping/ssh/iCamera 復帰せず） | kernel/initramfs を疑う。下表参照 |
| 30 | 版不一致（デプロイ後も旧バージョン） | update zip が検証で弾かれた。下表参照 |

## 失敗パターン辞書

| 症状 | 一次疑い | 確認コマンド / ログ |
|------|----------|---------------------|
| exit 20 起動タイムアウト | kernel / initramfs（zip に `factory_t31_ZMC6tiIDQN` を含めたか? カーネル込み更新は reboot 2 回で最大 300s） | シリアルコンソールなしでは SD の直接確認は不可。ping 復帰を待ち、復帰後 `ssh root@atomcam33 cat /etc/atomhack.ver`。復帰しなければ `--rollback` を**ユーザー確認のうえ**検討 |
| exit 30 版不一致 | update zip が initramfs のサイズ検証・名前検証で弾かれた | `ssh root@atomcam33 ls -la /media/mmc/update/` で残骸確認（zip が残っていれば未処理、消えていれば検証落ち）。`dmesg` / `atomhack.log` の update 行 |
| webui fail（curl 不通 / 404） | lighttpd / CGI 配置 | `ssh root@atomcam33 'ps | grep lighttpd'`、`/media/mmc/atomhack.log` の lighttpd 行、`curl -v http://atomcam33/cgi-bin/hack_ini.cgi` |
| rtsp fail（8554 不通 / フレーム取れず） | v4l2rtspserver / defconfig の有効化漏れ | `/tmp/hack.ini` の RTSP 設定（有効か・ポート）、`ssh root@atomcam33 'ps | grep v4l2rtsp'`、`nc -z atomcam33 8554` |
| icamera fail（pidof 空 / エラーログ） | libcallback / atom_patch（LD_PRELOAD フック） | `atomhack.log` の iCamera 行を grep、`ssh root@atomcam33 pidof iCamera_app`、直近の libcallback 変更 diff |
| tailscale fail | `tailscale.sh` / prebuilt バイナリの不整合 | `ssh root@atomcam33 tailscale version`（uname パース系の失敗が典型）、`tailscale status`、`atomhack.log` の tailscale 行 |

切り分けで原因が確定しない場合は debug-hunt のフレーム
（仮説表 → 計装 → 能動再現 → ログ相関、最大 5 ラウンド）に委譲する。

## NDJSON フォーマット例

`deploy_remote.sh` はサマリ 1 行、`smoke_test_remote.sh` はケースごとに 1 行を stdout に出す:

```json
{"tool":"deploy_remote","host":"atomcam33","result":"ok","exit":0,"old_ver":"4.0.8-flll.12","new_ver":"4.0.8-flll.13","boot_wait_sec":142}
{"case":"version","result":"pass","detail":"4.0.8-flll.13"}
{"case":"icamera","result":"pass","detail":"pid=1234"}
{"case":"webui","result":"fail","detail":"curl: (7) Failed to connect","evidence":"sim-results/deploy-20260612-031502/atomhack.log"}
{"case":"rtsp","result":"pass","detail":"port 8554 open, 1 frame ok"}
{"case":"tailscale","result":"skip","detail":"disabled in hack.ini"}
{"case":"resources","result":"pass","detail":"mem_free=18MB load=1.2"}
```

- `result`: `pass` / `fail` / `skip`
- fail 時は `evidence` に `sim-results/deploy-<timestamp>/` 配下の収集ログパスが入る
- 収集物: `atomhack.log` 末尾 100 行、`dmesg` 末尾、`ps`、`/tmp/hack.ini`

## 復旧手順への参照

起動不能時の手動復旧（`.bak` リネーム戻し、`--rollback`、最終手段の SD 抜去）は
atomcam_tools の **`docs/development/remote-deploy.md`** を正とする。
本 Skill からは `--rollback` を **Ask first**（ユーザー確認後のみ）で実行する。
