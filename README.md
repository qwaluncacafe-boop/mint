# ミントサーバー 稼働状況 — GitHub Pages版

一般プレイヤー向けのステータスページです。

## 公開するもの

- 過去3日間の稼働履歴
- お知らせ
- 障害
- 正常

Minecraft は `technology-trombone.gl.joinmc.link` を5分ごとに確認します。
Discord BOT は設定ファイルで ON / OFF を切り替えます。初期値は ON です。

## GitHub Pages公開手順

1. ZIPの中身をGitHubの公開リポジトリへアップロードします。
2. リポジトリの Settings → Pages を開きます。
3. Build and deployment の Source を `GitHub Actions` にします。
4. Actions で `Deploy GitHub Pages` を実行します。
5. その後、`MintServer Status Monitor` が5分ごとにMinecraftを確認し、履歴を更新します。

GitHub PagesのカスタムActions公開には `configure-pages@v5`、`upload-pages-artifact@v4`、`deploy-pages@v4` を利用しています。

## お知らせ・Discord状態の変更

`data/config.json` を編集してGitHubへpushしてください。

```json
{
  "discordBotStatus": "ON",
  "notices": [
    {
      "date": "2026-09-23T18:00:00+09:00",
      "title": "メンテナンスのお知らせ",
      "body": "本日18:00からメンテナンスを行います。"
    }
  ]
}
```

GitHub Pages側で表示するのは、お知らせの日時・タイトル・本文だけです。

## 監視履歴

GitHub Actionsは5分ごとに実行し、5分単位の監視結果を最大3日分保存します。
画面ではそれを96本の太めの縦バーにまとめ、約45分ごとの状態を横長の履歴として表示します。
その45分区間に1回でも障害があれば、そのバーは赤になります。
