# cute-cafe-idle

ブラウザで遊べる、1画面完結のかわいいカフェ経営インクリメンタルゲームです。  
`index.html` を開くだけで動きます。

## 遊び方

- `1日営業を開始` でその日の営業を始めます
- 営業中は売上が自動で増えます
- ブーストや営業中イベントを使って、その日の流れを少し変えられます
- 実績、研究、解放ツリーで新しい遊び方を増やしていきます
- セーブは自動保存され、設定タブからエクスポートやインポートもできます

## ファイル構成

- `index.html`: エントリーポイント
- `style.css`: UI の見た目
- `script.js`: ゲームロジック
- `analytics.js`: 非表示アクセス計測の設定
- `404.html`: GitHub Pages 用の 404 ページ

## GitHub Pages 公開

### ルートで公開する場合

1. GitHub のリポジトリを開く
2. `Settings` -> `Pages` を開く
3. `Deploy from a branch` を選ぶ
4. `main` ブランチ / `/ (root)` を選んで保存する
5. 公開 URL を確認する

### docs/ で公開する場合

1. `index.html` `style.css` `script.js` `analytics.js` `404.html` を `docs/` に配置する
2. GitHub の `Pages` 設定で `main` ブランチ / `/docs` を選ぶ
3. 公開後に URL を確認する

## 非表示アクセス計測

ページに表示しないアクセス計測として `GoatCounter` を使えるようにしてあります。

1. [GoatCounter](https://www.goatcounter.com/) でサイトを作成する
2. `analytics.js` の `goatcounterUrl` に自分の URL を入れる

```js
window.CAFE_ANALYTICS = window.CAFE_ANALYTICS || {
  goatcounterUrl: 'https://YOUR-CODE.goatcounter.com/count',
};
```

3. GitHub Pages に公開すると、画面には何も出さずにアクセス数を確認できます

メモ:
- `file://` でローカル確認している間は送信しないようにしています
- 画面上にアクセスカウンターは表示しません

## ローカル確認

- そのまま `index.html` をブラウザで開く
- 整形確認: `npm run format:check`
- 整形実行: `npm run format`
