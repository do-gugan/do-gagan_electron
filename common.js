/**
 * 共通オブジェクト、データ
**/
"use strict";

const path = require('path');
const fs = require('fs'); //ファイルアクセス
const readline = require("readline"); //1行ずつ読む
const dggRecord = require("./dggRecord"); //レコードクラス

//グローバルオブジェクト
const mainWin = null; //メインウインドウハンドル
const i18n = null;
const menu = null;
const cmenu = null;
const dialog = null;
const config = null;

const lang = null;
const records = []; //ログ（dggRecordsオブジェクト）を保持する配列

class Common {
  constructor() {
    //console.log("constructor of common.");
  }

  /**
   * レンダラーのPlayerにvideo/audioタグをセット
   * @param {string} path メディアファイルのフルパス
   * @example
   *   openMediaFile(path);
   */
  openMediaFile(pth) {
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
      //console.log("Searching " + logpath);
      if (fs.existsSync(logpath)) {
        this.openLogFile(logpath,true);
    }
  }

  /**
   * ログファイルを開いてオブジェクトに格納
   * @param {string} path //メディアファイルのフルパス
   * @param {boolean} clear //trueなら既存ログをクリア
   * @example
   *   openLogFile(path);
   */
  openLogFile(pth, clear = false) {
      if (clear == true) {
            records.length = 0;
      }
      const text = fs.readFileSync(pth, "utf8");
      const lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし
      for (var line of lines) {
        var cols = line.split("\t");
        if (isFinite(cols[0]) == true && cols[0].length > 0){ //第一カラム（タイムスタンプ）が数値か判定
          let rec = new dggRecord("row"+records.length,cols[0], cols[1], cols[2]);
          records.push(rec);
          this.mainWin.webContents.send('add-record-to-list',rec); //レンダラーに描画指示
        } else {
          //第一カラムが数値でなければスキップ
          console.log('Invalid line: ' + line);
        };
      }
      //this.menu.enableMenuWhenLogOpened(); //ここでは呼ばれない
  }


  openSupportSite() {
    const shell = require('electron').shell;
    shell.openExternal('https://do-gugan.com/tools/');
  }

  /**
   * レンダラーに下部UIの表示トグルイベントを伝え、結果を取得
   * @param {string} path メディアファイルのフルパス
   * @example
   *   openMediaFile(path);
   */
  toggleNewMemoBlockFromMenu(result) {
      this.mainWin.webContents.send('toggle-new-memo-block');
  }

  playPauseToPlayer() {
    this.mainWin.webContents.send('play-pause');
  }

  setMainWin(browserWindow) {
    this.mainWin = browserWindow;
  }

  getMainWin(browserWindow) {
    return this.mainWin;
  }
  
 //レンダラーから新規メモを受け取る
  addNewMemoFromGUI(inTime, script, speaker) {
    const rec = new dggRecord(records.length + 1, inTime, script, speaker);
    records.push(rec);
    records.sort(function(a, b) {
      if (a.inTime > b.inTime) {
        return 1;
      } else {
        return -1;
      };
    });
    this.mainWin.webContents.send('clear-records'); //一度リストをクリア
    records.forEach(r => {
      this.mainWin.webContents.send('add-record-to-list',r); //レンダラーに描画指示      
    });
  }

  //レンダラーから更新されたセルの情報を受け取りrecordに反映
  memoChanged(id,script) {
    records.find(r => r.id == id).script = script;
  }

  inTimeChanged(id,inTime) {
    records.find(r => r.id == id).inTime = inTime;
  }

  speakerChanged(id,speaker) {
    records.find(r => r.id == id).speaker = speaker;
  }

  getSpeakerFromId(id) {
    return records.find(r => r.id == id).speaker;
  }

}

module.exports = new Common();

//--------------------------------
// exports
//--------------------------------
// module.exports = {
//     mainWin: mainWin,
//     menu: menu,
//     dialog: dialog,
//     i18n: i18n,
//     config: config,
//     dggRecord: dggRecord,
//     //updateWindowTitle: updateWindowTitle,
//     openMediaFile: openMediaFile,
//     openLogFile: openLogFile,
//     toggleNewMemoBlockFromMenu: toggleNewMemoBlockFromMenu,
//     playPauseToPlayer: playPauseToPlayer,
// }

