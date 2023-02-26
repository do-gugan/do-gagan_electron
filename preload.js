"use strict";

const { contextBridge, ipcRenderer} = require("electron");
//const common = require('./common'); //異なるインスタンスがとれてしまう
const i18n = require('./i18n');
const dggRecord = require('./dggRecord').dggRecord;

contextBridge.exposeInMainWorld(
  "api", {// <-- ここでつけた名前でひもづく。ここでは"window.api"  

    // --------------------------------------------
    //          メインプロセス → レンダラー(HTML)
    // --------------------------------------------
    //サンプルAPI（非同期）
    // receiveValue: (listener) => ipcRenderer.on("receive-value", (event, arg) => listener(arg)),
    
    //レンダラー側での受け取り例：
    // window.api.receiveValue((value) => {
    //    console.log(value);
    // }

    openVideo: (callback) => ipcRenderer.on("open-video", (event, argv)=>callback(event, argv)),
    openAudio: (callback) => ipcRenderer.on("open-audio", (event, argv)=>callback(event, argv)),
    toggleNewMemoBlockFromMenu: (callback) => ipcRenderer.on("toggle-new-memo-block", (event, argv)=>callback(argv)),

    togglePlayPause: (callback) => ipcRenderer.on("play-pause", ()=>callback()),
    skipForward: (callback) => ipcRenderer.on("skip-forward", ()=>callback()),
    skipBackward: (callback) => ipcRenderer.on("skip-backward", ()=>callback()),

    playbackSpeedUp: (callback) => ipcRenderer.on("playback-speed-up", ()=>callback()),
    playbackSpeedDown: (callback) => ipcRenderer.on("playback-speed-down", ()=>callback()),
    playbackSpeedReset: (callback) => ipcRenderer.on("playback-speed-reset", ()=>callback()),
   
    openReplaceWindow: (callback) => ipcRenderer.on("open-replace-window", ()=>callback()),

    //ログ1件の内容を受け取り、リストに追加する
    addRecordToList: (callback) => ipcRenderer.on("add-record-to-list", (event,record)=>callback(record)),
    //まとまった数のレコードを一括で追加
    addRecordsToList: (callback) => ipcRenderer.on("add-records-to-list", (event,records)=>callback(records)),
    //レコードを全削除
    clearRecords: (callback) => ipcRenderer.on("clear-records", ()=>callback()),

    //コンテクストメニューの選択からの処理
    setSpeakerOfRow: (callback) => ipcRenderer.on("set-speaker-of-row", (event, id, speaker)=>callback(id, speaker)),
    deleteRow: (callback) => ipcRenderer.on("delete-row", (event, id)=>callback(id)),

    //メニューからのスキップ秒数の変更
    setSkipTime: (callback) => ipcRenderer.on("set-skip-time", (event, direction, idx)=>callback(direction, idx)),

    //メインプロセスの設定変更を通知
    loadConfig: (callback) => ipcRenderer.on("load-config", ()=>callback()),

    //ダーティフラグ表示の更新
    updateDirtyFlag: (callback) => ipcRenderer.on("update-dirty-flag", (event, flag)=>callback(flag)),

    //touchbarのスライダー操作に連動して再生位置を更新
    changePositionFromTouchbar: (callback) => ipcRenderer.on("change-position-from-touchbar", (event, pos)=>callback(pos)),

    // --------------------------------------------
    //         レンダラー(HTML) → メインプロセス
    // --------------------------------------------
    //サンプルAPI（非同期）
    //.send(ch, ...args)は非同期でメインにメッセージを送るのみ。index.js側でipcMain.on(ch,...)で受信
    //sendMessageToMain: () => ipcRenderer.send("send-message-to-main"),
    //.sendSyncなら同期だが特に利用する必要はない

    //結果を受け取りたい場合は.invoke
    //getSomeInfoFromMain: () => ipcRenderer.invoke("getSomeInfoFromMain").then(result => result).catch(err => console.log(err)),
    //レンダラーからの呼び出し例： console.log(window.api.getSomeInfoFromMain());
    //非同期での結果受け取り: window.api.getSomeInfoFromMain().then((result)=>{ 処理...})}

    //GUIでスキップ秒数を変更したらメニューに反映
    setSkipTimeFromGUI:(direction, index) => ipcRenderer.send('setSkipTimeFromGUI', direction, index),

    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key).then(result => result).catch(err => console.log(err)),

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    },
    setConfig: (key, value) => ipcRenderer.invoke("setConfig", key, value).then(result => result).catch(err => console.log(err)),

    getAppVersion: () => {
      //const _ = new i18n(this.lang, 'default');
      const p = require('./package.json');
      return p.version;
    },

    //ドロップされたファイルを開く
    openDroppedFile: (path) => ipcRenderer.invoke('openDroppedFile', path),

    toggleNewMemoBlockMenu : (result) => ipcRenderer.send('toggleNewMemoBlockMenu', result),

    //新しいメモ（dggRecordオブジェクト）をレンダラーからメインプロセスに
    addNewMemoFromGUI: (inTime, script, speaker) => ipcRenderer.invoke('addNewMemoFromGUI',inTime, script, speaker).then(result => result).catch(err => console.log(err)),

    //既存メモのテキストが更新された
    memoChanged:(id,script) => ipcRenderer.send('memoChanged', id, script),
    //inTimeChanged:(id,inTime) => ipcRenderer.send('inTimeChanged', id, inTime),
    //speakerChanged:(id,speaker)=>ipcRenderer.send('speakerChanged', id, speaker),

    //右クリックからコンテクストメニューを開く
    openContextMenuOn:(event, id)=>ipcRenderer.send('openContextMenuOn', event, id), //ログのタイムコード上
    openContextMenuOnText:(event, id, selectionStart, selectionEnd)=>ipcRenderer.send('openContextMenuOnText', event, id, selectionStart, selectionEnd), //ログのテキストエリア上

    saveCapture:(dataURL, currentSec) => ipcRenderer.invoke('saveCapture', dataURL, currentSec),

    setMediaDuration : (duration) => ipcRenderer.invoke('setMediaDuration', duration),

    getCurrentRecordId: (position) => ipcRenderer.invoke('getCurrentRecordId', position).then(result => result),

    //OSがmacOSか調べる
    isDarwin: () => ipcRenderer.invoke("isDarwin").then(result => result).catch(err => console.log(err)),
  }
);