"use strict";

const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const common = require('./common');
const menu = require('./menu');
const config = require('./config');
const dialog = require('./dialog');
const path = require('path');
const i18n = require('./i18n');
const dggRecord = require('./dggRecord');

//------------------------------------
// グローバル変数
//------------------------------------
// ウィンドウ管理用
// ここではまだウインドウが初期化されていないのでオブジェクトをセットできない
let mainWin;
let playerBox;
let player; 

function createWindow() {
    mainWin = new BrowserWindow({
        width: 1800,
        height: 1200,
        backgroundColor: 'white',
        webPreferences: {
            worldSafeExecuteJavaScript: true,
            nodeIntegration: false,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, './preload.js'),
            nativeWindowOpen: true,
        }
    });
    mainWin.setMinimumSize(1600,1200);
    mainWin.loadFile('./index.html');
    mainWin.webContents.openDevTools(); //Devツールを開く

    //common下に参照を渡す
    //common.mainWin = mainWin;
    common.setMainWin(mainWin);
    common.menu = menu;
    common.i18n = i18n;
    common.dialog = dialog;
    common.config = config;

    //グローバル変数にHTML要素オブジェクトをセット
    // playerBox = mainWin.webContents.document.querySelector("#player-box");
    // player = mainWin.webContents.document.querySelector("#player");
    // showPlaceholderInPlayer();
}

app.whenReady().then(()=>{
  // 言語設定を取得する
  const locale = config.get('locale') || app.getLocale();

  // メニューを適用する
  menu.setTemplate(locale);
 
  // ウィンドウを開く
  createWindow();

});

//------------------------------------
// [app] イベント処理
//------------------------------------
// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
    // macOS以外はアプリを終了する
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  
  // アプリがアクティブになった時の処理
  // (macOSはDocのアイコンがクリックされたとき）
  app.on('activate', () => {
    // ウィンドウがすべて閉じられている場合は新しく開く
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
  
  //----------------------------------------
  // IPC通信
  //----------------------------------------

  //レンダラー -> メイン
  // ipcMain.handle('getSomeInfoFromMain', (event) => {
  //   return "hogefuga";
  // });

  // 設定情報を取得
  ipcMain.handle('getConfig', (event, data) => {
    return( config.get(data) )
    //return 'en'; //英語環境テスト用
  });

  // 言語設定を保存
  ipcMain.handle('setLocale', async (event, data) => {
    config.set('locale', data)
    dialog.reboot(mainWin)      // 再起動する？
  });

  //「新規メモ欄」メニューのチェック状態を更新   
  ipcMain.on('toggleNewMemoBlockMenu', async (event, data) => {
    menu.toggleNewMemoBlockMenu(data);
  });

  //ドロップされたメディアファイルを開く
  ipcMain.handle('openDroppedFile', (event, path) => {
    console.log(path);
    common.openMediaFile(path);    
  });

  //レンダラーから新規メモを受け取る
  ipcMain.handle('addNewMemoFromGUI', (event, inTime, script, speaker) => {
    common.addNewMemoFromGUI(inTime, script, speaker);
  });

  //レンダラーからリスト内のログが更新されたら受け取る
  ipcMain.on('memoChanged', (event, id, script) => {
    common.memoChanged(id,script);
    console.log(id,script);
  });
  // ipcMain.on('inTimeChanged', (event, id, inTime) => {
  //   common.inTimeChanged(id,inTime);
  //   console.log(id,inTime);
  // });
  // ipcMain.on('speakerChanged', (event, id, speaker) => {
  //   common.speakerChanged(id,speaker);
  //   console.log(id,speaker);
  // });

  //ログ上のコンテクストメニューを開く
  ipcMain.on('openContextMenuOn', (event, id) => {
    const lang = config.get('locale') || app.getLocale();
    const _ = new i18n(lang, 'menu');
    const template = [
      {
        label: _.t('SPEAKERLABEL'),
        submenu: [
          {id:'SPK_0', label: '0', type: 'checkbox', click: ()=>{
            setSpeakerOfRow(id, 0);
          }},
          {id:'SPK_1', label: '1', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 1);
              }},
          {id:'SPK_2', label: '2', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 2);
            }},
          {id:'SPK_3', label: '3', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 3);
            }},
          {id:'SPK_4', label: '4', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 4);
            }},
          {id:'SPK_5', label: '5', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 5);
            }},
          {id:'SPK_6', label: '6', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 6);
            }},
          {id:'SPK_7', label: '7', type: 'checkbox', click: ()=>{
              setSpeakerOfRow(id, 7);
            }}
        ]
    },
    {
        label: _.t('DELETE_ITEM'), click: ()=>{
            deleteRow(id);
        }
    },
    
    ];
    const m = Menu.buildFromTemplate(template);

    //recordsから現在のspeakerを調べてチェックをする
    m.getMenuItemById('SPK_' + common.getSpeakerFromId(id)).checked = true;

    //コンテクストメニューを表示
    m.popup(BrowserWindow.fromWebContents(event.sender));
    
  });

  /**
   * コンテクストメニューの選択から、レンダラーの当該行に反映
   * @param {string} id 
   * @param {Number} speaker 
   */
  function setSpeakerOfRow(id, speaker) {
    common.mainWin.webContents.send('set-speaker-of-row',id, speaker);
  }
  function deleteRow(id) {
    common.mainWin.webContents.send('delete-row',id);
  }

//--------------------------------
// exports
//--------------------------------
// module.exports = {
//   common: common,
// }