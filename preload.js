"use strict";

const { contextBridge, ipcRenderer} = require("electron")
//const common = require('./common'); //異なるインスタンスがとれてしまう
const i18n = require('./i18n');
const dggRecord = require('./dggRecord').dggRecord;

contextBridge.exposeInMainWorld(
  "api", {// <-- ここでつけた名前でひもづく。ここでは"window.api"  

    //メインプロセスからレンダラー
    openVideo: (callback) => ipcRenderer.on("open-video", (event, argv)=>callback(event, argv)),
    openAudio: (callback) => ipcRenderer.on("open-audio", (event, argv)=>callback(event, argv)),
    toggleNewMemoBlockFromMenu: (callback) => ipcRenderer.on("toggle-new-memo-block", (event, argv)=>callback(event, argv)),

    togglePlayPause: (callback) => ipcRenderer.on("play-pause", ()=>callback()),

    //ログ1件の内容を受け取り、リストに追加する
    addRecordToList: (callback) => ipcRenderer.on("add-record-to-list", (event, argv)=>callback(event, argv)),
    clearRecords: (callback) => ipcRenderer.on("clear-records", ()=>callback()),

    //レンダラーからメインプロセス
    //サンプルAPI（非同期）
    getSomeInfoFromMain: () => ipcRenderer.invoke("getSomeInfoFromMain").then(result => result).catch(err => console.log(err)),
    //使用例： console.log(window.api.getSomeInfoFromMain());

    //.send(cj, ...args)は非同期でメインにメッセージを送るのみ。index.js側でipcMain.on(ch,...)で受信
    //.sendSyncなら同期
    //.invokeは非同期で結果を受け取る

    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    },

    getAppVersion: () => {
      //const _ = new i18n(this.lang, 'default');
      const p = require('./package.json');
      return p.version;
    },

    //ドロップされたファイルを開く
    openDroppedFile: (path) => ipcRenderer.invoke('openDroppedFile', path),

    toggleNewMemoBlockMenu : (result) => {
      ipcRenderer.invoke('toggleNewMemoBlockMenu', result)
    },

    //新しいメモ（dggRecordオブジェクト）をレンダラーからメインプロセスに
    addNewMemoFromGUI: (inTime, script, speaker) => ipcRenderer.invoke('addNewMemoFromGUI',inTime, script, speaker).then(result => result).catch(err => console.log(err)),
  
  }
);