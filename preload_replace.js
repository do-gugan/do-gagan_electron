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

    getMatchCount:(word) => ipcRenderer.invoke('getMatchCount', word),
    executeRaplace:(before,after) => ipcRenderer.invoke('executeRaplace', before,after),


  }
);
