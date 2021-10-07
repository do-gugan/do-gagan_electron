const { contextBridge, ipcRenderer} = require("electron")
//const fs = require('fs')
const i18n = require('./i18n');

contextBridge.exposeInMainWorld(
  "requires", {// <-- ここでつけた名前でひもづく。ここでは"window.requires"
    //json5 : require("json5"),//npmで取得したライブラリを渡す時の例。レンダラーにそのまま渡す

    ipcRenderer : ipcRenderer,//ipcRendererも渡せるのでやり取りできる

    // getSetting :  () => {// fsも読み込める。レンダリングプロセスにそのまま渡さず、functionにしてできることを制限したほうがセキュリアそう。。。
    //   const setting_path = 'c:/appSetting.json5';
    //   return fs.existsSync(setting_path) ? fs.readFileSync(setting_path, 'utf8') : '{}'
    // }

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    }

  }
);




