"use strict";

const { contextBridge, ipcRenderer, webUtils } = require("electron");
//サンドボックス化されたpreloadではローカルモジュール（./i18n等）をrequireできない。
//翻訳辞書とバージョンはメインプロセスから同期IPCで取得する。

//翻訳辞書のキャッシュ（言語×名前空間ごとに初回のみメインから取得）
const dictionaries = {};
function translate(label, lang, ns) {
    const key = `${lang}:${ns}`;
    if (!(key in dictionaries)) {
        dictionaries[key] = ipcRenderer.sendSync('getLocaleDictionary', lang, ns);
    }
    return (dictionaries[key] || {})[label];
}

//アプリバージョン（起動時に1回だけ取得）
const appVersion = ipcRenderer.sendSync('getAppVersion');

contextBridge.exposeInMainWorld(
  "api", {// <-- ここでつけた名前でひもづく。ここでは"window.api"

    // --------------------------------------------
    //          メインプロセス → レンダラー(HTML)
    //  ipcRenderer.on: メインからのプッシュ通知を受け取る
    //  （eventオブジェクトはレンダラーに渡さない）
    // --------------------------------------------

    openVideo: (callback) => ipcRenderer.on("open-video", (event, path)=>callback(path)),
    openAudio: (callback) => ipcRenderer.on("open-audio", (event, path)=>callback(path)),
    toggleNewMemoBlockFromMenu: (callback) => ipcRenderer.on("toggle-new-memo-block", (event, argv)=>callback(argv)),

    togglePlayPause: (callback) => ipcRenderer.on("play-pause", ()=>callback()),
    skipForward: (callback) => ipcRenderer.on("skip-forward", ()=>callback()),
    skipBackward: (callback) => ipcRenderer.on("skip-backward", ()=>callback()),

    playbackSpeedUp: (callback) => ipcRenderer.on("playback-speed-up", ()=>callback()),
    playbackSpeedDown: (callback) => ipcRenderer.on("playback-speed-down", ()=>callback()),
    playbackSpeedReset: (callback) => ipcRenderer.on("playback-speed-reset", ()=>callback()),

    //ログ1件の内容を受け取り、リストに追加する
    addRecordToList: (callback) => ipcRenderer.on("add-record-to-list", (event,record)=>callback(record)),
    //まとまった数のレコードを一括で追加
    addRecordsToList: (callback) => ipcRenderer.on("add-records-to-list", (event,records)=>callback(records)),
    //レコードを全削除
    clearRecords: (callback) => ipcRenderer.on("clear-records", ()=>callback()),
    //指定したエレメントの後ろにレコードを追加
    insertRecordToList: (callback) => ipcRenderer.on("insert-record-to-list", (event, newID, recJSON, targetId)=>callback(newID, recJSON, targetId)),

    //コンテクストメニューの選択からの処理
    setSpeakerOfRow: (callback) => ipcRenderer.on("set-speaker-of-row", (event, id, speaker)=>callback(id, speaker)),
    deleteRow: (callback) => ipcRenderer.on("delete-row", (event, id)=>callback(id)),
    updateRow: (callback) => ipcRenderer.on("update-row", (event, id, script)=>callback(id,script)),

    //メニューからのスキップ秒数の変更
    setSkipTime: (callback) => ipcRenderer.on("set-skip-time", (event, direction, idx)=>callback(direction, idx)),

    //メインプロセスの設定変更を通知
    loadConfig: (callback) => ipcRenderer.on("load-config", ()=>callback()),

    //ダーティフラグ表示の更新
    updateDirtyFlag: (callback) => ipcRenderer.on("update-dirty-flag", (event, flag)=>callback(flag)),

    //touchbarのスライダー操作に連動して再生位置を更新
    changePositionFromTouchbar: (callback) => ipcRenderer.on("change-position-from-touchbar", (event, pos)=>callback(pos)),

    //メニューからセル統合を実行
    executeMergeCells: (callback) => ipcRenderer.on("execute-merge-cells", ()=>callback()),

    // --------------------------------------------
    //         レンダラー(HTML) → メインプロセス
    //  結果が必要なもの: ipcRenderer.invoke（Promiseを返す）
    //  通知のみのもの:   ipcRenderer.send
    // --------------------------------------------

    //GUIでスキップ秒数を変更したらメニューに反映
    setSkipTimeFromGUI:(direction, index) => ipcRenderer.send('setSkipTimeFromGUI', direction, index),

    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがローカライズテキストを取得
    t : (label, lang) => translate(label, lang, 'default'),

    //設定を保存
    setConfig: (key, value) => ipcRenderer.invoke("setConfig", key, value),

    getAppVersion: () => appVersion,

    //ドロップされたファイルを開く
    openDroppedFile: (path) => ipcRenderer.invoke('openDroppedFile', path),

    //ドロップされたFileオブジェクトからOSのファイルパスを取得
    //（File.pathはElectron 32で削除されたためwebUtilsを使用）
    getPathForFile: (file) => webUtils.getPathForFile(file),

    toggleNewMemoBlockMenu : (result) => ipcRenderer.send('toggleNewMemoBlockMenu', result),

    //新しいメモの内容をレンダラーからメインプロセスに
    addNewMemoFromGUI: (inTime, script, speaker) => ipcRenderer.invoke('addNewMemoFromGUI',inTime, script, speaker),

    //既存メモのテキストが更新された
    memoChanged:(id,script) => ipcRenderer.send('memoChanged', id, script),

    //右クリックからコンテクストメニューを開く
    openContextMenuOn:(id)=>ipcRenderer.send('openContextMenuOn', id), //ログのタイムコード上
    openContextMenuOnText:(id, selectionStart, selectionEnd)=>ipcRenderer.send('openContextMenuOnText', id, selectionStart, selectionEnd), //ログのテキストエリア上

    saveCapture:(dataURL, currentSec) => ipcRenderer.invoke('saveCapture', dataURL, currentSec),

    setMediaDuration : (duration) => ipcRenderer.invoke('setMediaDuration', duration),

    getCurrentRecordId: (position) => ipcRenderer.invoke('getCurrentRecordId', position),

    //メニューアイテムの有効化・無効化
    enableOrDisableMenuItemMerge: (bool) => ipcRenderer.send('enableOrDisableMenuItemMerge', bool),

    //メモのセルをマージする
    mergeCurrentAndNextCells: (id) => ipcRenderer.send('mergeCurrentAndNextCells', id),

    //OSがmacOSか調べる
    isDarwin: () => ipcRenderer.invoke("isDarwin"),
  }
);
