# cute-cafe-idle

ブラウザで遊べる、小さな1画面完結のカフェ経営インクリメンタルゲームです。  
`index.html` を開くだけで遊べます。

## 遊び方

- `1日営業を開始` でその日の営業を始めます
- 営業中は自動で売上が増えます
- ブーストを使って、その日の売上を伸ばします
- 実績、研究、解放ツリーで新しい要素を増やしていきます
- セーブは自動保存され、`設定` タブからエクスポート / インポート / 全リセットができます

## ファイル構成

- `index.html`: ゲーム本体のエントリーポイント
- `style.css`: 画面全体のスタイル
- `script.js`: ゲームロジックとセーブ処理
- `404.html`: GitHub Pages 用の404ページ

## GitHub Pages で公開する

このプロジェクトは相対パスで参照しているため、GitHub Pages のルート公開でも `docs/` 公開でも動かしやすい構成です。

### ルートで公開する場合

1. GitHub のリポジトリを開く
2. `Settings` -> `Pages` を開く
3. `Deploy from a branch` を選ぶ
4. `main` ブランチ / `/ (root)` を選んで保存する
5. 数分待って公開URLを開く

### docs/ で公開する場合

1. `index.html` `style.css` `script.js` `404.html` を `docs/` に配置する
2. GitHub の `Pages` 設定で `main` ブランチ / `/docs` を選ぶ
3. 保存後、公開URLを開く

## ローカル確認

- そのまま `index.html` をブラウザで開く
- 整形確認: `npm run format:check`
- 整形実行: `npm run format`
