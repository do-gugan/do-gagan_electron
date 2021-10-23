＃Todo
- [] ファイル保存
    - [] 上書き
    - [] 自動保存
    - [] 別名書き出し
- [] Lite形式書き出し
- [x] スクリーンショット保存
    -[] 解像度選択？
- [x] キーボードショートカット
- [] メニューからスキップ時間の変更
- [] 設定画面
    - [] ウインドウ作成
        - [] 連携
        - [] 保存
    - [] ファンクションキーテンプレート
    - [] 自動保存間隔
    - [] ロックオン自動更新
    - [] Shiftキーを押すとn倍ジャンプ
- [] 一括置換
- [x] ログのフィルター
- [] 自動スクロール？
- [-] 最近使用したファイル https://www.electronjs.org/docs/latest/tutorial/recent-documents
    Windowsではそのファイル形式を関連付けしたアプリでないと表示されないぽい。メディアファイルだとあまり意味ない？
    一応セットしたので、ビルドした時に検証。

- [] アプリ自動更新 https://www.electronjs.org/docs/latest/tutorial/updates (公式API使用にはコード署名が必要)
    -[] 最低限、更新チェック機能はつける
- [] タッチバーサポート？　https://www.electronjs.org/docs/latest/api/touch-bar
## 完成後
- [] ビルド
    - [x] アプリアイコン https://www.electronjs.org/docs/latest/api/native-image
    - [x]] MacOS用対応
    - [] Windows on ARM 対応　https://www.electronjs.org/docs/latest/tutorial/windows-arm
    - [] ストア出品？

# Issues
getConfigで正しいlocaleが取得できていない。