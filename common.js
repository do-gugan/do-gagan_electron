/**
 * 共通オブジェクト、データ
**/
"use strict";

const path = require('path');
const fs = require('fs'); //ファイルアクセス
const readline = require("readline"); //1行ずつ読む
const dggRecord = require("./dggRecord"); //レコードクラス
const i18n = require("./i18n");

//グローバルオブジェクト
const app = null;
const browserWindow = null;
const mainWin = null; //メインウインドウハンドル
const menu = null;
const cmenu = null;
const dialog = null;
const config = null;
const mediaPath = null;
const mediaDuration = null;
const lang = null;
const records = []; //ログ（dggRecordsオブジェクト）を保持する配列
const _ = null;

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
      this.mediaPath = pth;

      this.menu.enableMenuWhenMediaOpened();

      //OSの最近使ったファイルに登録する（Windowsはファイル形式が対応付けられていないと表示されない？）
      this.app.addRecentDocument(pth);

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
            this.mainWin.webContents.send('clear-records');
      }
      const text = fs.readFileSync(pth, "utf8");
      const lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし
      for (var line of lines) {
        var cols = line.split("\t");
        if (isFinite(cols[0]) == true && cols[0].length > 0){ //第一カラム（タイムスタンプ）が数値か判定
          let rec = new dggRecord(cols[0], cols[1], cols[2]);
          records.push(rec);
          this.mainWin.webContents.send('add-record-to-list',rec); //レンダラーに描画指示
        } else {
          //第一カラムが数値でなければスキップ
          console.log('Invalid line: ' + line);
        };
      }
      //this.menu.enableMenuWhenLogOpened(); //ここでは呼ばれない
  }

//--------------------------------
// #region 設定ウインドウ
//--------------------------------

  /**
   * 保存。パスは指定されない限り動画と同じ。ファイルが存在しなければ作成
   * @param {string} path 名前を指定して保存する時のパス 
   * @param {string} format 保存形式（デフォルトは'2.0'） 
   * @param {boolean} isAutoSave 自動保存ならtrue
   */
  async saveLog(pth = '', format = '2.0', isAutoSave = false){
    //ファイル名の指定がない場合は動画パスから生成
    let logpath = '';
    if (pth.length == 0) {
      logpath = this.mediaPath.replace(path.extname(this.mediaPath),".dggn.txt"); //ログ形式Ver.2の拡張子
    } else {
      logpath = pth;
    }

    //名前をつけて保存、自動上書き保存以外の時はバックアップファイルを作成
    if (pth.length == 0 && isAutoSave == false && fs.existsSync(logpath)) {
      let shouldBackup = this.config.get('backupFile');  
      console.log("backup file:" + shouldBackup);
      if (shouldBackup == true) {
        let backupPath = logpath.replace(path.extname(logpath),".bak");
        //console.log(backupPath);
        fs.copyFileSync(logpath, backupPath);
      }
    }

    //改行コードの決定
    var ret = '\r'; //デフォルトでUNIX系改行コード
    if (process.platform == 'win32') {
      //console.log("win");
      ret = '\r\n';
    } else if (process.platform == 'darwin') {
      //console.log("mac");
      ret = '\n';
    }

    let body = "";
    let charset = 'utf8';

    const _ = new this.i18n(this.lang, 'default');

    //Youtube用の注意書きを挿入（改行コードを置換）
    if (format == 'youtube'){
      body += _.t('YOUTUBE_CHAPTER_GUIDE');//.repalce('\n', ret);

      //先頭チャプターが0ではない場合、追加する
      if (parseInt(records[0].inTime) != 0){
        console.log("Adding 0 chapter.");
        body += this.secToYoutubeChapterTimeCode(0, this.mediaDuration) + ` ` + _.t('YOUTUBE_CHAPTER_START') + ret;
      };
    }

    records.forEach(r => {

      switch (format) {
        case '1.0':
          //動画眼1.0形式
          //charset = 'sjis';
          //（未実装）
          break;
        case 'youtube':
          body += this.secToYoutubeChapterTimeCode(r.inTime, this.mediaDuration) + ` ${r.script}${ret}`;
          break;
        default:
          //2.0形式（デフォルト）
          body += `${r.inTime}\t${r.script}\t${r.speaker}${ret}`;
          break;
      }
    });
    //console.log(body);
    fs.writeFileSync(logpath, body,charset);
  }
//
/**
 * 秒インデックスをYoutubeチャプター形式形式に変換
 * 動画の長さで、m:ss、mm:ss、hh:mm:ssを選択
 * @param {*} sec 変換したい秒値
 * @param {*} duration 動画の長さ
 * @returns 変換後の文字列
 */
 secToYoutubeChapterTimeCode(secTotal , duration) {
    if (duration < 600) {
      //m:ss
      const min = Math.floor(secTotal / 60);
      const sec = secTotal - min*60;
      return min + ":" + ( '00' + sec ).slice( -2 )
    
    } else if (duration < 3600) {
      //mm:ss
      const min = Math.floor(secTotal / 60);
      const sec = secTotal - min*60;
      return ( '00' + min ).slice( -2 ) + ":" + ( '00' + sec ).slice( -2 )

    } else {
      //hh:mm:ss
      const hour = Math.floor(secTotal / 3600);
      const min = Math.floor((secTotal - (hour * 60)) / 60);
      const sec = secTotal - (hour * 3600) - (min * 60);
      return ( '00' + hour ).slice( -2 ) + ":" +( '00' + min ).slice( -2 ) + ":" + ( '00' + sec ).slice( -2 )

    }
  }
  // #endregion


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
      this.mainWin.webContents.send('toggle-new-memo-block', result);
  }

  //再生制御系
  playPauseToPlayer() {
    this.mainWin.webContents.send('play-pause');
  }
  skipForwardToPlayer() {
    this.mainWin.webContents.send('skip-forward');
  }
  skipBackwardToPlayer(event) {
    this.mainWin.webContents.send('skip-backward');
  }

  setSkipTime(direction, index) {
    this.mainWin.webContents.send('set-skip-time', direction, index);
  }

  //--------------------------------
  // 設定ウインドウ
  //--------------------------------
  openSettingsWindow() {
    const _ = new this.i18n(this.lang, 'dialog');
    let settingsWindow = new this.browserWindow({
    parent: mainWin,
    modal: true,
    width: 500,
    height: 565,
    backgroundColor: 'white',
    resizable: false,
    minimizable: false,
    maximizable: false,
    alwaysOnTop: true,
    fullscreenable: false,
    skipTaskbar: true,
    show: false,
    title:_.t('SETTINGS'),
    webPreferences: {
      worldSafeExecuteJavaScript: true,
      nodeIntegration: false,
      enableRemoteModule: true,
      contextIsolation: true,
      preload: path.join(__dirname, './preload_settings.js'),
      nativeWindowOpen: true,
      accessibleTitle: _.t('SETTINGS_ACCESSIBLETITLE')
    }
  });
  settingsWindow.setMenu(null);
  settingsWindow.loadFile('settings.html');
  // if (!this.app.isPackaged) {
    settingsWindow.setSize (settingsWindow.getSize()[0]+600, settingsWindow.getSize()[1]);
    settingsWindow.webContents.openDevTools(); //Devツールを開く
  // }

  // レンダリングが完了したら呼ばれる
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  //ウインドウが閉じられる時呼ばれる
  settingsWindow.on('closed', () => {
    //console.log("settings window closed.");
    this.mainWin.webContents.send('load-config');
  });
  return settingsWindow;


  }

  //--------------------------------
  // 置換ダイアログウインドウ
  //--------------------------------
  openReplaceWindow() {
    const _ = new this.i18n(this.lang, 'dialog');
    let replaceWindow = new this.browserWindow({
      parent: mainWin,
      modal: true,
      width: 400,
      height: 190,
      backgroundColor: 'white',
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      fullscreenable: false,
      skipTaskbar: true,
      show: false,
      title:_.t('REPLACE'),
      webPreferences: {
        worldSafeExecuteJavaScript: true,
        nodeIntegration: false,
        enableRemoteModule: true,
        contextIsolation: true,
        preload: path.join(__dirname, './preload_replace.js'),
        nativeWindowOpen: true,
        accessibleTitle: _.t('REPLACE_ACCESSIBLETITLE')
      }
    });

    replaceWindow.setMenu(null);
    replaceWindow.loadFile('replace.html');
    // if (!this.app.isPackaged) {
    //   replaceWindow.webContents.openDevTools(); //Devツールを開く
    // }

    // レンダリングが完了したら呼ばれる
    replaceWindow.once('ready-to-show', () => {
      replaceWindow.show();
      //this.replaceWin = replaceWindow;
    });

    //ウインドウが閉じられる時呼ばれる
    replaceWindow.on('closed', () => {
      //this.replaceWin = null;
    });
    return replaceWindow;
  }

  getMainWin(browserWindow) {
    return this.mainWin;
  }

  //レンダラーから新規メモを受け取る
  addNewMemoFromGUI(inTime, script, speaker) {
    const rec = new dggRecord(inTime, script, speaker);
    records.push(rec);
    records.sort(function(a, b) {
      return a.inTime - b.inTime;
    });
    this.mainWin.webContents.send('clear-records'); //一度リストをクリア
    records.forEach(r => {
      this.mainWin.webContents.send('add-record-to-list',r); //レンダラーに描画指示      
    });
  }

  /**
   * レンダラーからキャプチャー画像を受け取る
   * @param {string} dataURL //base64エンコードされた画像データ
   * @param {String} sec //再生時間（"12:34"形式。変換してファイル名にアペンド）
   */
  saveCapture(dataURL, currentSec) {
    //余計なヘッダを除去
    dataURL = dataURL.replace('data:image/jpeg;base64,','');

    //秒を分秒形式に変換
    currentSec = currentSec.replace(":","m")+"s";
    let cpath = this.mediaPath.replace(path.extname(this.mediaPath), "@" + currentSec + ".jpg");
    try {
        fs.writeFileSync(cpath, dataURL,{encoding: 'base64'});
    } catch(e) {
        console.log(e);
    }
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

  //レンダラーから通知されたメディアの総再生時間を保存
  setMediaDuration(duration) {
    this.mediaDuration = duration;
  }

  /**
  * コンテクストメニューから話者フラグ変更を実行
  * @param {string} id 
  * @param {Number} speaker 
  */
  setSpeakerOfRow(id, speaker) {
    //配列を更新
    this.speakerChanged(id, speaker);
    records.forEach(e => console.log(e.id +':'+ e.speaker));

    //レンダラーにも反映
    this.mainWin.webContents.send('set-speaker-of-row',id, speaker);
  }
  /**
   * コンテクストメニューからの削除を実行
   * @param {Number} id 
   */
  deleteRow(id) {
    //配列から削除
    const idx = records.indexOf(records.find(r => r.id == id)); //配列中の位置を調べ、
    records.splice(idx,1); //削除

    //レンダラーにも反映
    this.mainWin.webContents.send('delete-row',id);
  }
//--------------------------------
// #region 置換ダイアログ用
//--------------------------------

/**
 * 検索語に対してマッチしたrowの数を返す
 * @param {string} word 検索語
 * @returns ヒットしたrowの数
 */
  getMatchCount(word) {
    return records.filter(r => r.script.includes(word)).length;
  }

  /**
   * 全rowに対して置換を実行
   * @param {*} before 検索語
   * @param {*} after 置換後
   */
   executeReplace(before, after) {
    this.mainWin.webContents.send('clear-records'); //一度リストをクリア

    //置換実行
    console.log(`replace ${before} to ${after}`);
    records.forEach(r => {
      r.script = r.script.replace(before, after);
      this.mainWin.webContents.send('add-record-to-list',r); //レンダラーに表示
    });

  }

// #endregion



}


module.exports = new Common();
