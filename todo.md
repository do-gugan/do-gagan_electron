＃Todo
- [] ファイル保存
    - [] 上書き
    - [] 自動保存
    - [] 別名書き出し
- [] Lite形式書き出し
- [x] スクリーンショット保存
    -[] 解像度選択？
- [x] キーボードショートカット
- [x] メニューからスキップ時間の変更
- [x] 設定永続化
- [] 設定画面
    - [x] ウインドウ作成
    - [x] ファンクションキーテンプレート
    - [] 自動保存間隔
    - [] ロックオン自動更新（5シチュエーション個別設定）
    - [x] Shiftキーを押すとn倍ジャンプ
- [x] 新規メモ欄の開閉状態を保存／復帰
- [x] 一括置換
- [x] ログのフィルター
- [] 自動スクロール？
- [-] 最近使用したファイル https://www.electronjs.org/docs/latest/tutorial/recent-documents
    Windowsではそのファイル形式を関連付けしたアプリでないと表示されないぽい。メディアファイルだとあまり意味ない？
    一応セットしたので、ビルドした時に検証。

- [] アプリ自動更新 https://www.electronjs.org/docs/latest/tutorial/updates (公式API使用にはコード署名が必要)
    -[] 最低限、更新チェック機能はつける
- [] タッチバーサポート？　https://www.electronjs.org/docs/latest/api/touch-bar
- [] Tooltip整備

## 完成後
- [] ビルド
    - [x] アプリアイコン https://www.electronjs.org/docs/latest/api/native-image
    - [x]] MacOS用対応
    - [] Windows on ARM 対応　https://www.electronjs.org/docs/latest/tutorial/windows-arm
    - [] ストア出品？

# Issues
- [] getConfigで正しいlocaleが取得できていない。→一度も保存されていない
- [x] 行削除すると、row-1というIDができる。
- [x] 起動時の画面の描画がダサいので隠す

