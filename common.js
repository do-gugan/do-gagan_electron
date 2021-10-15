/**
 * 共通オブジェクト、データ
**/
const path = require('path');
const fs = require('fs'); //ファイルアクセス
const readline = require("readline"); //1行ずつ読む
const dggRecord = require("./dggRecord"); //レコードクラス

//グローバルオブジェクト
const mainWin = null; //メインウインドウハンドル
const i18n = null;
const menu = null;
const dialog = null;
const config = null;

const lang = null;
const records = []; //ログ（dggRecordsオブジェクト）を保持する配列

/**
 * ウインドウタイトルにファイル名をセット
 * @param {string} filename ファイル名（パス）
 * @example
 *   updateWindowTitle(); //ファイル名なし
 *   updateWindowTitle(filename); //ファイル名あり
 */
// function updateWindowTitle(fileName = null) {
//     const _ = new i18n(this.lang, 'default');
//     p = require('./package.json');
//     const fix = _.t('APPNAME') + "3 Ver." + p.version;
//     if (fileName === null){
//         this.mainWin.title = fix;
//     } else {
//         this.mainWin.title = fileName + " | " + fix;
//     }
// }

/**
 * レンダラーのPlayerにvideo/audioタグをセット
 * @param {string} path メディアファイルのフルパス
 * @example
 *   openMediaFile(path);
 */
function openMediaFile(pth) {
    const ext = path.extname(pth).toLowerCase();
    if (ext == '.mp4' || ext == '.webm' || ext == '.ogv') {
      //動画ファイル
      this.mainWin.webContents.send('open-video', pth);
    } else {
      //音声ファイル
      this.mainWin.webContents.send('open-audio', pth);
    }
    this.menu.enableMenuWhenMediaOpened();

    //同名のログファイルが存在する場合は読み込む
    const logpath = pth.replace(path.extname(pth),".dggn.txt"); //ログ形式Ver.2の拡張子
    console.log("Searching " + logpath);
    if (fs.existsSync(logpath)) {
      openLogFile(logpath,true);
  }
}

/**
 * ログファイルを開いてオブジェクトに格納
 * @param {string} path //メディアファイルのフルパス
 * @param {boolean} clear //trueなら既存ログをクリア
 * @example
 *   openLogFile(path);
 */
 function openLogFile(pth, clear = false) {
    if (clear == true) {
          records.length = 0;
    }
    const text = fs.readFileSync(pth, "utf8");
    lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし
    for (var line of lines) {
      var cols = line.split("\t");
      if (isFinite(cols[0]) == true && cols[0].length > 0){ //第一カラム（タイムスタンプ）が数値か判定
        // console.log(cols[0]);
        // console.log(cols[1]);
        // console.log(cols[2]);
        rec = new dggRecord(cols[0], cols[1], cols[2]);
        console.log(rec.timeStamp);
        records.push(rec);
      } else {
        //第一カラムが数値でなければスキップ
        console.log('Invalid line: ' + line);
      };
    }
    //this.menu.enableMenuWhenLogOpened();
    console.log ("records.length:"+records.length);
}


/**
 * レンダラーに下部UIの表示トグルイベントを伝え、結果を取得
 * @param {string} path メディアファイルのフルパス
 * @example
 *   openMediaFile(path);
 */
function toggleNewMemoBlockFromMenu(result) {
    this.mainWin.webContents.send('toggle-new-memo-block');
}

function playPauseToPlayer() {
  this.mainWin.webContents.send('play-pause');
}

//--------------------------------
// exports
//--------------------------------
module.exports = {
    mainWin: mainWin,
    menu: menu,
    dialog: dialog,
    i18n: i18n,
    config: config,
    //updateWindowTitle: updateWindowTitle,
    openMediaFile: openMediaFile,
    openLogFile: openLogFile,    
    toggleNewMemoBlockFromMenu: toggleNewMemoBlockFromMenu,
    playPauseToPlayer: playPauseToPlayer,
}

