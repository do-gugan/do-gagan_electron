const { contextBridge, ipcRenderer} = require("electron")
//const fs = require('fs')
const i18n = require('./i18n');

contextBridge.exposeInMainWorld(
  "api", {// <-- ここでつけた名前でひもづく。ここでは"window.api"
    //json5 : require("json5"),//npmで取得したライブラリを渡す時の例。レンダラーにそのまま渡す

    //ipcRenderer : ipcRenderer,//ipcRenderer自体は公開しない

    // getSetting :  () => {// fsも読み込める。レンダリングプロセスにそのまま渡さず、functionにしてできることを制限したほうがセキュリアそう。。。
    //   const setting_path = 'c:/appSetting.json5';
    //   return fs.existsSync(setting_path) ? fs.readFileSync(setting_path, 'utf8') : '{}'
    // }

    //メインプロセスからレンダラー
    //on: (callback) => ipcRenderer.on(channel, (event, argv)=>callback(event, argv)), //汎用（危険？）
    openVideo: (callback) => ipcRenderer.on("open-video", (event, argv)=>callback(event, argv)),
    openAudio: (callback) => ipcRenderer.on("open-audio", (event, argv)=>callback(event, argv)),
    toggleNewMemoBlockFromMenu: (callback) => ipcRenderer.on("toggle-new-memo-block", (event, argv)=>callback(event, argv)),

    
    //レンダラーからメインプロセス
    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    },

    getAppVersion: () => {
      const _ = new i18n(this.lang, 'default');
      p = require('./package.json');
      return p.version;
    },

    toggleNewMemoBlockMenu : (result) => {
      ipcRenderer.invoke('toggleNewMemoBlockMenu', result)
    },

    //ドロップされたファイルを開く
    openDroppedFile: (path) => ipcRenderer.invoke('openDroppedFile', path),

  }
);