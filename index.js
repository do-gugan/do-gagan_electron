const { app, BrowserWindow, ipcMain } = require('electron');
const common = require('./common');
const menu = require('./menu');
const config = require('./config');
const dialog = require('./dialog');
const path = require('path');
const i18n = require('./i18n');

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
        width: 1600,
        height: 1200,
        backgroundColor: 'white',
        webPreferences: {
            nodeIntegration: false,
            enableRemoteModule: true,
            contextIsolation: true,
            preload: path.join(__dirname, './preload.js'),
            nativeWindowOpen: true,
        }
    });
    mainWin.setMinimumSize(640,400);
    mainWin.loadFile('./index.html');
    mainWin.webContents.openDevTools(); //Devツールを開く

    //common下に参照を渡す
    common.mainWin = mainWin;

    //common.updateWindowTitle(); //ウインドウタイトルを初期値でセット

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
  ipcMain.handle('toggleNewMemoBlockMenu', async (event, data) => {
    menu.toggleNewMemoBlockMenu(data);
  });

  //ドロップされたメディアファイルを開く
  ipcMain.handle('openDroppedFile', (event, path) => {
    console.log(path);
    common.openMediaFile(path);
  });
