# Todo
- [x] ファイルインポート
    - [x] Premire Proの音声テキスト化ファイル（スピーカー情報を含むtxt形式）
- [x] ファイル保存
    - [x] 上書き
    - [x] 自動保存
    - [x] 別名書き出し
        - [x] 1.0形式
        - [x] Youtube用チャプター
- [x] ダーティフラグ表示
- [x] Lite形式書き出し
- [x] スクリーンショット保存
    -[] 解像度選択？
- [x] キーボードショートカット
- [x] メニューからスキップ時間の変更
- [x] 設定永続化
- [x] 設定画面
    - [x] ウインドウ作成
    - [x] ファンクションキーテンプレート
    - [x] 自動保存間隔
    - [x] ロックオン自動更新（5シチュエーション個別設定）
        - [x] playerのスライダー操作によるスキップでも発動するようにEventHandlerを使う方式に変更
    - [x] Shiftキーを押すとn倍ジャンプ
    - [x] バックアップファイルの生成
- [x] 新規メモ欄の開閉状態を保存／復帰
- [x] 一括置換
- [x] ログのフィルター
- [x] 自動スクロール？
- [x]] 自動フォーカス？
- [-] 最近使用したファイル https://www.electronjs.org/docs/latest/tutorial/recent-documents
    Windowsではそのファイル形式を関連付けしたアプリでないと表示されないぽい。メディアファイルだとあまり意味ない？
    一応セットしたので、ビルドした時に検証。
- [x] メモの分割
- [] macOSでのキーボードショートカットがOSとかぶる問題

- [] アプリ自動更新 https://www.electronjs.org/docs/latest/tutorial/updates (公式API使用にはコード署名が必要)
    -[] 最低限、更新チェック機能はつける
- [x] タッチバーサポート？　https://www.electronjs.org/docs/latest/api/touch-bar
- [x] Tooltip整備
- [x] 再生速度変更ボタン

## 完成後
- [] ビルド
    - [x] アプリアイコン https://www.electronjs.org/docs/latest/api/native-image
    - [x] MacOS用対応
        -[x] M1対応
    - [] Windows on ARM 対応　https://www.electronjs.org/docs/latest/tutorial/windows-arm
    - [] ストア出品？

- [] マニュアル整備
    - 変更された仕様
        - オートロックオンのシチュエーションが選べるようになった
        - macOSにおける標準的ショートカットのコンフリクトについて
        - 1.0形式ログファイル非対応 
        - Premier Proの書き起こしインポート形式をsrtではなくtxtへ

# Issues
- [] getConfigで正しいlocaleが取得できていない。→一度も保存されていない→手動ロケール指定は凍結する
- [x] 大量のログを読み込むのが遅い。メイン->レンダラーの個別処理を非同期化や一括処理で高速化できるか実験
- [] 自動スクロールの制御最適化
- [x] Macでタイトルバーのファイル名のパスを除去できていない
- [x] Lite書き出し時、クォーツを実体参照に置き換える
- [x] Mac?一見リセットされてるが、新規メモを入れると前のファイルのメモが出現する。
    - [] 別メディアオープン時点でチェックを入れる
- [x] カメラアイコンが小さくて見えない。
