const { contextBridge, ipcRenderer} = require("electron")
//const fs = require('fs')
const common = require('./common');
const i18n = require('./i18n');
//const common = require('./common');

contextBridge.exposeInMainWorld(
  "api", {// <-- ここでつけた名前でひもづく。ここでは"window.api"
    //json5 : require("json5"),//npmで取得したライブラリを渡す時の例。レンダラーにそのまま渡す
    common: common,
    //ipcRenderer : ipcRenderer,//ipcRenderer自体は公開しない

    // getSetting :  () => {// fsも読み込める。レンダリングプロセスにそのまま渡さず、functionにしてできることを制限したほうがセキュリアそう。。。
    //   const setting_path = 'c:/appSetting.json5';
    //   return fs.existsSync(setting_path) ? fs.readFileSync(setting_path, 'utf8') : '{}'
    // }

    //メインプロセスからレンダラー
    openVideo: (callback) => ipcRenderer.on("open-video", (event, argv)=>callback(event, argv)),
    openAudio: (callback) => ipcRenderer.on("open-audio", (event, argv)=>callback(event, argv)),
    toggleNewMemoBlockFromMenu: (callback) => ipcRenderer.on("toggle-new-memo-block", (event, argv)=>callback(event, argv)),

    playPause: () => ipcRenderer.on('play-pause'),




    //レンダラーからメインプロセス
    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    },

    getAppVersion: () => {
      //const _ = new i18n(this.lang, 'default');
      p = require('./package.json');
      return p.version;
    },

    //ドロップされたファイルを開く
    openDroppedFile: (path) => ipcRenderer.invoke('openDroppedFile', path),

    toggleNewMemoBlockMenu : (result) => {
      ipcRenderer.invoke('toggleNewMemoBlockMenu', result)
    },

  }
);