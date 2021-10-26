"use strict";

const { contextBridge, ipcRenderer} = require("electron");
const i18n = require('./i18n');

contextBridge.exposeInMainWorld(
  "api", {
    // 指定されたキーの設定を取得する
    getConfig:(key) => ipcRenderer.invoke('getConfig', key),

    //レンダラーがi18nクラス経由でローカライズテキストを取得
    t : (label, lang) => {
        const _ = new i18n(lang, 'dialog');
        return _.t(label);
    },

    t_def : (label, lang) => {
        const _ = new i18n(lang, 'default');
        return _.t(label);
    },

    setConfig: (key, value) => ipcRenderer.invoke("setConfig", key, value).then(result => result).catch(err => console.log(err)),

    // getMatchCount:(word) => ipcRenderer.invoke('getMatchCount', word),
    // executeRaplace:(before,after) => ipcRenderer.invoke('executeRaplace', before,after),


  }
);

