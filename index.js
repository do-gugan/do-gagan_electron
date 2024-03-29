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

common.app = app;
common.browserWindow = BrowserWindow;
common.i18n = i18n;
common.dialog = dialog;
common.config = config;
common.menu = menu;
common.lang = config.get('locale') || app.getLocale();

function createWindow() {
  //console.log("load size width: "+config.get('windowSizeWidth') + " height: "+ config.get('windowSizeHeight'));
  //console.log("load pose top: "+config.get('windowPosTop') + " left: "+ config.get('windowPosLeft'));
  const mainWin = new BrowserWindow({
        width: config.get('windowSizeWidth'),
        height: config.get('windowSizeHeight'),
        backgroundColor: 'white',
        webPreferences: {
            worldSafeExecuteJavaScript: true,
            nodeIntegration: false,
            sandbox: false, //Electron20への一時対処
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, './preload.js')
    }
    });
    mainWin.loadFile('./index.html');
    mainWin.setMinimumSize(800,600);
    //mainWin.setPosition(config.get('windowPosTop'),config.get('windowPosLeft'));

  //------------------------------------
  // [mainWin] 準備できたら呼ばれる
  //------------------------------------
  mainWin.on('ready-to-show', () => {
    let top = config.get('windowPosTop');
    let left = config.get('windowPosLeft');
    common.setAutoSaveInterval(config.get('autoSaveInterval'));
    if (top != undefined && left != undefined) {
      mainWin.setPosition(top, left);
    }
  
    if (!app.isPackaged) {
      mainWin.webContents.openDevTools(); //Devツールを開く
    }
  });


  //------------------------------------
  // [mainWin] 設定保存
  //------------------------------------
  // ウィンドウが閉じられたとき処理
  mainWin.on('close', (event) => {
    //console.log("save size width: "+ (mainWin.getSize()[0]-1) + " height: "+ (mainWin.getSize()[1]+20));
    //最小の800x600を下回らないよう補正
    config.set('windowSizeWidth',mainWin.getSize()[0]-1);
    config.set('windowSizeHeight',mainWin.getSize()[1]-2);

    //console.log("save pos top: "+ (mainWin.getPosition()[0]) + " left: "+ (mainWin.getPosition()[1]));
    config.set('windowPosTop',mainWin.getPosition()[0]);
    config.set('windowPosLeft',mainWin.getPosition()[1]);

    //未保存データがある時は確認
    // if (common.isDirty == true) {
      common.handleUnsavedLog(event);
    //   const lang = config.get('locale') || app.getLocale();
    //   const _ = new i18n(lang, 'dialog');
    //   const options = {
    //     type: 'warning',
    //     buttons: [_.t('UNSAVED_DATA_SAVE'), _.t('UNSAVED_DATA_DISPOSE'), _.t('UNSAVED_DATA_CANCEL')],
    //     title: _.t('UNSAVED_DATA_TITLE'),
    //     message: _.t('UNSAVED_DATA_MESSAGE').replace('%1', path.basename(common.mediaPath).replace(path.extname(common.mediaPath),".dggn.txt")),
    //   }; 
    //   switch (dialog.showConfirmation(options)) {
    //     case 0: //上書き保存して終了
    //     common.saveLog();
    //       break;
    //     case 1: //破棄して終了
    //       break;
    //     case 2: //キャンセル
    //       event.preventDefault();
    //       break;
    //   }
    //}
  })

    //common下に参照を渡す
    //common.mainWin = mainWin;
    common.mainWin = mainWin; 
}


app.whenReady().then(()=>{
  // 言語設定を取得する
  const locale = config.get('locale') || app.getLocale();
  //const locale = 'en'; //英語UIテスト時に有効化する
  // メニューを適用する
  menu.setTemplate(locale);

  // ウィンドウを開く
  createWindow();
});

//------------------------------------
// [app] イベント処理
//------------------------------------
//メインウインドウが閉じられようとする時
app.on("BrowserWindow.close", () => {
  if (process.platform == 'darwin') {
    //TouchBarオブジェクトを破棄
    common.mainWin.setTouchBar(null);
  }
  common.mainWin = null;
});

// すべてのウィンドウが閉じられたときの処理
app.on('window-all-closed', () => {
    // macOS以外はアプリを終了する
    //if (process.platform !== 'darwin') {
    app.quit();
    //}
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
  ipcMain.handle('getConfig', (event, key) => {
    //console.log(`getConfig key:${key} result:` + common.config.get(key));
    return (common.config.get(key))
  });

  //設定を保存
  ipcMain.handle('setConfig', (event, key, value) => {
    //console.log(`setConfig: key:${key} value:${value}`);
    return( config.set(key, value) ); //boolean
    //return 'en'; //英語環境テスト用
  });

  // 言語設定を保存
  ipcMain.handle('setLocale', async (event, data) => {
    common.config.set('locale', data);
    dialog.reboot(common.mainWin);     // 再起動する？
  });

  //ドロップされたメディアファイルを開く
  ipcMain.handle('openDroppedFile', (event, mediaPath) => {
    //未保存データの処理
    if (common.isDirty == true) {
      const lang = common.config.get('locale') || app.getLocale();
      const _ = new i18n(lang, 'dialog');
      const options = {
        type: 'warning',
        buttons: [_.t('UNSAVED_DATA_SAVE_CONTINUE'), _.t('UNSAVED_DATA_DISPOSE_CONTINUE'), _.t('UNSAVED_DATA_CANCEL')],
        title: _.t('UNSAVED_DATA_TITLE'),
        message: _.t('UNSAVED_DATA_MESSAGE_CONTINUE').replace('%1', path.basename(common.mediaPath).replace(path.extname(common.mediaPath),".dggn.txt")),
        defaultId: 3,
        cancelId: 2
      };
      switch (dialog.showConfirmation(options)) {
        case 0: //上書き保存して開く
          common.saveLog();
          break;
        case 1: //破棄して開く
          break;
        case 2: //キャンセル
          return;
      }
  
    }
    common.clearLog();
    common.openMediaFile(mediaPath);
    //Macでドラッグ＆ドロップ時、フォーカスがFinderのままになるので明示的にフォアグラウンドフロントにする
    if (process.platform == 'darwin') {
      app.focus({ steal: true });
    }
  });

  //レンダラーから新規メモを受け取る
  ipcMain.handle('addNewMemoFromGUI', (event, inTime, script, speaker) => {
    common.addNewMemoFromGUI(inTime, script, speaker);
  });

   //レンダラーからキャプチャー画像を受け取る
  ipcMain.handle('saveCapture', (event, dataURL, currentSec) => {
    common.saveCapture(dataURL, currentSec);
  });

  //レンダラーから通知されたメディアの総再生時間を保存
  ipcMain.handle('setMediaDuration', (event, duration) => {
    common.setMediaDuration(duration);
  });

  //レンダラーからリスト内のログが更新されたら受け取る
  ipcMain.on('memoChanged', (event, id, script) => {
    common.memoChanged(id,script);
  });

  //「新規メモ欄」メニューのチェック状態を更新   
  ipcMain.on('toggleNewMemoBlockMenu', async (event, data) => {
    menu.toggleNewMemoBlockMenu(data);

    //設定保存
    config.set('newMemoBlockShown', data);
  });

  //GUIでスキップ秒数を変更したらメニューにも反映
  ipcMain.on('setSkipTimeFromGUI', (event, direction, idx) => {
    menu.setSkipTimeFromGUI(direction, idx);
  });

  //現在の再生位置にもっとも近いレコードのIDを返す
  ipcMain.handle('getCurrentRecordId', (event, position) => {return common.getCurrentRecordId(position);});

  //OSがmacOSかどうかを返す
  ipcMain.handle('isDarwin', () => {
    if (process.platform == 'darwin') {
      console.log("macOS");
      return true;
    } else {
      console.log("not macOS");
      return false;
    }
  });
  // #endregion

  //レンダラーからメニュー項目を有効化・無効化する
  ipcMain.on('enableOrDisableMenuItemMerge', (event, arg) => {
    const bool = JSON.parse(arg);
    menu.enableOrDisableMenuItemMerge(bool.key);
  });

  //--------------------------------
  // 選択中のセルと次のセルを結合する（次のセルの中身を末尾に連結し、次のセルを削除）
  //--------------------------------
  ipcMain.on('mergeCurrentAndNextCells',(event, arg) => {
    //実際の処理はレンダラー（renderer.js）側でtextareaのキーボードイベントから呼んで処理
    const id = JSON.parse(arg);
    //console.log("id:"+id.key);
    common.mergeCurrentAndNextCells(id.key);
  });


  //--------------------------------
  // #region ログ（タイムスタンプ）上のコンテクストメニューを開く
  //--------------------------------
  ipcMain.on('openContextMenuOn', (event, id) => {
    const lang = config.get('locale') || app.getLocale();
    const _ = new i18n(lang, 'menu');
    const template = [
      {
        label: _.t('SPEAKERLABEL'),
        submenu: [
          {id:'SPK_0', label: '0', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 0);
          }},
          {id:'SPK_1', label: '1', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 1);
              }},
          {id:'SPK_2', label: '2', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 2);
            }},
          {id:'SPK_3', label: '3', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 3);
            }},
          {id:'SPK_4', label: '4', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 4);
            }},
          {id:'SPK_5', label: '5', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 5);
            }},
          {id:'SPK_6', label: '6', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 6);
            }},
          {id:'SPK_7', label: '7', type: 'checkbox', click: ()=>{
            common.setSpeakerOfRow(id, 7);
            }}
        ]
    },
  {
        label: _.t('DELETE_ITEM'), click: ()=>{
            common.deleteRow(id);
        }
    },
    
    ];

    //--------------------------------
    // #region 右クリックメニュー
    //--------------------------------

    const m = Menu.buildFromTemplate(template);

    //recordsから現在のspeakerを調べてチェックをする
    m.getMenuItemById('SPK_' + common.getSpeakerFromId(id)).checked = true;

    //コンテクストメニューを表示
    m.popup(BrowserWindow.fromWebContents(event.sender));
    
  });
// #endregion


  //--------------------------------
  // #region ログ（テキストボックス）上のコンテクストメニューを開く
  //--------------------------------
  ipcMain.on('openContextMenuOnText', (event, id, selectionStart, selectionEnd) => {
    const lang = config.get('locale') || app.getLocale();
    const _ = new i18n(lang, 'menu');
    const template = [
      {id:'CUT', label: _.t('CUT'), role: 'cut'},
      {id:'COPY', label: _.t('COPY'), role: 'copy'},
      {id:'PASTE', label: _.t('PASTE'), role: 'paste'},
      {type: 'separator'},
      {
        label: _.t('MERGE')+'(^F)', click: ()=>{
            common.mergeCurrentAndNextCells(id);
      }
      },
        {
          label: _.t('SPLIT_HERE'), click: ()=>{
              common.splitLog(id, selectionStart, selectionEnd);
          }
      }
    ];

    //--------------------------------
    // #region 右クリックメニュー
    //--------------------------------

    const m = Menu.buildFromTemplate(template);
    //コンテクストメニューを表示
    m.popup(BrowserWindow.fromWebContents(event.sender));
    
  });
// #endregion


//--------------------------------
// #region 置換ダイアログ用
//--------------------------------

/**
 * 検索語に対してマッチしたrowの数を返す
 */
ipcMain.handle('getMatchCount', async (event, word) => {
  return common.getMatchCount(word);
});

ipcMain.handle('executeRaplace', async (event, before, after ) => {
  common.executeReplace(before, after);
});

// #endregion

//--------------------------------
// #region 設定ダイアログ用
//--------------------------------

ipcMain.on('setAutoSaveIntervalOnMemory', () => {
  common.setAutoSaveInterval(config.get('autoSaveInterval'));
});

// #endregion

//--------------------------------
// #region タイムスタンプ変換ダイアログ用
//--------------------------------

ipcMain.handle('getMediaFileName', async (event, ) => {
  return common.getMediaFileName();
});

ipcMain.handle('getMediaBirthDateTime', async (event, ) => {
  return common.getMediaBirthDateTime();
});

ipcMain.handle('setTimeOffset', async (event, offset) => {
  return common.setTimeOffset(offset);
});

// #endregion


//--------------------------------
// exports
//--------------------------------
// module.exports = {
//   common: common,
// }