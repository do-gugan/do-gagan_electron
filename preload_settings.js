"use strict";

const { contextBridge, ipcRenderer} = require("electron");
//サンドボックス化されたpreloadではローカルモジュールをrequireできないため、
//翻訳辞書はメインプロセスから同期IPCで取得してキャッシュする
const dictionaries = {};
function translate(label, lang, ns) {
    const key = `${lang}:${ns}`;
    if (!(key in dictionaries)) {
        dictionaries[key] = ipcRenderer.sendSync('getLocaleDictionary', lang, ns);
    }
    return (dictionaries[key] || {})[label];
}

contextBridge.exposeInMainWorld(
  "api", {
    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがローカライズテキストを取得
    t : (label, lang) => translate(label, lang, 'dialog'),

    t_def : (label, lang) => translate(label, lang, 'default'),

    setConfig: (key, value) => ipcRenderer.invoke("setConfig", key, value).then(result => result).catch(err => console.log(err)),

    setAutoSaveIntervalOnMemory: () => ipcRenderer.send('setAutoSaveIntervalOnMemory'),


  }
);
