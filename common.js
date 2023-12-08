/**
 * 共通オブジェクト、データ
**/
"use strict";

const path = require('path');
const fs = require('fs'); //ファイルアクセス
const util = require("util");
const readline = require("readline"); //1行ずつ読む
const dggRecord = require("./dggRecord"); //レコードクラス
const i18n = require("./i18n");
const iconv = require("iconv-lite"); //ShiftJISを扱うライブラリ
const { builtinModules } = require('module');
const { common } = require('./dggTouchbar');

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
const isDirty = false; //未保存データがあるか管理するフラグ
const lang = null;
const records = []; //ログ（dggRecordsオブジェクト）を保持する配列
const _ = null;
const dggTouchBar = null; //TouchBarのシングルトンオブジェクト
let autoSaveTimer; //自動保存のタイマー配列
let autoSaveInterval;
const stat = util.promisify(fs.stat);  // fs.statをPromise化


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

          //TouchBar表示（macOS）
      if (process.platform == 'darwin') {
        this.mainWin.setTouchBar(null); //既存オブジェクトをパージ
        
        //console.log("new dggTouchbar");
        this.dggTouchBar = require('./dggTouchbar');
        this.dggTouchBar.setCommon(this);
        this.mainWin.setTouchBar(this.dggTouchBar.getTouchBar());
      }

      //同名のログファイルが存在する場合は読み込む
      const logpath = pth.replace(path.extname(pth),".dggn.txt"); //ログ形式Ver.2の拡張子
      //console.log("Searching " + logpath);
      if (fs.existsSync(logpath)) {
        this.openLogFile(logpath,true);
    }

    //自動保存タイマーを初期化
    this.toggleAutoSave(this.config.get('autoSaveSwitch'),false);
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
        this.clearLog();
      }
      const text = fs.readFileSync(pth, "utf8");
      const lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし
      //let syncMethod = "";

      //第一列が時刻（hh:mm:ss）形式だったら変換処理
      const firstTC = lines[0].split('\t')[0]; //1行目1項目を取り出し
      console.log(firstTC);
      if (/[0-9]{2}:[0-9]{2}:[0-9]{2}/.test(firstTC) == true) {
        console.log("Opening syncTimeDialog");
        this.openSyncTimeWindow();

        //hh:mm:ssを変換しながらインポート
        for (var line of lines) {
          var cols = line.split("\t");
          const regex = /[0-9]{2}:[0-9]{2}:[0-9]{2}/;
          if (regex.test(cols[0]) == true){ //第一カラム（タイムスタンプ）がhh:mm:ss形式か判定
            console.log(cols[0] + "to" + this.HHMMSSTosec(cols[0]));
            let rec = new dggRecord(this.HHMMSSTosec(cols[0]), cols[1], cols[2]);
            records.push(rec);
          } else {
            //第一カラムがhh:mm:ss形式でなければスキップ
            console.log('Invalid line: ' + line);
          };
        }

        //計算したオフセットはここでは受け取れずコールバック関数setTimeOffset()で反映
      } else {
        //通常のインポート処理

        //行数だけループ処理
        for (var line of lines) {
          var cols = line.split("\t");
          if (isFinite(cols[0]) == true && cols[0].length > 0){ //第一カラム（タイムスタンプ）が数値か判定
            let rec = new dggRecord(cols[0], cols[1], cols[2]);
            records.push(rec);
          } else {
            //第一カラムが数値でなければスキップ
            console.log('Invalid line: ' + line);
          };
        }

  
      }

      this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示
      this.setDirtyFlag(false); //ダーティフラグをクリア
      //this.menu.enableMenuWhenLogOpened(); //ここでは呼ばれない

  }
             
  //全レコードから指定秒数offsetだけ引く
  setTimeOffset(offset) {
    //console.log("Offset received from dialog: "+ offset);
    this.mainWin.webContents.send('clear-records'); //一度リストをクリア

    //オフセット秒数補正実行
    records.forEach(r => {
      //console.log(r.inTime +" " + r.script);
      r.inTime = r.inTime - offset;
      this.mainWin.webContents.send('add-record-to-list',r); //レンダラーに表示
    });
  }

  /**
   * 指定方法で時刻を絶対タイムスタンプに変換して返す
   * @param {*} timeOfDay hh:mm:ss形式の文字列
   * @param {*} startTime 開始時刻 (hh:mm:ss形式の文字列)
   */
  ConvertTimeOfDay2TC(timeOfDay, startTime) {
    return HHMMSSTosec(timeOfDay) - HHMMSSTosec(startTime);
  }

  /**
   * 他形式のログファイルをインポート（Premiere Pro/動画眼1.0形式）
   * @param {*} pth ファイルのパス
   * @param {*} clear trueなら既存のログを削除
   */
  importLogFile(pth, clear = false) {
    if (clear == true) {
      this.clearLog();
    }
    let text = fs.readFileSync(pth, "utf8");
    let lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし

    //1行目をサンプルとしてファイル形式を推定（1.0形式 or Premiere Pro出力ファイル）
    const firstLine = lines[0];
    const premiereMatch = firstLine.match(/\d\d;\d\d;\d\d;\d\d - \d\d;\d\d;\d\d;\d\d/); //Ver.22辺りからセミコロン区切りに
    const dgg1Match = firstLine.match(/^\d\d:\d\d:\d\d\t/);
    if (premiereMatch != null && premiereMatch.length == 1) {
      console.log("Format is Premiere transcribed txt.");
      lines= [];
      //改行2連続を1ブロックとして分割
      const pRecords = text.toString().split(/\r\n\r\n|\r\r|\n\n/);
      pRecords.forEach(r => {
        const line = r.split(/\r\n|\r|\n/);
        //console.log("length:" + line.length);
        if (line.length == 3) { //3行に満たないレコードは除外
          let inTime = line[0].match(/\d\d;\d\d;\d\d/)[0].replaceAll(";",":");
          inTime = this.HHMMSSTosec(inTime);
          const script = line[2];
          const speaker = line[1].match(/ (\d+)/) ? line[1].match(/ (\d+)/)[1] : 0; //話者番号を切り出せたらその数字、NULLなら0を入れる
          const rec = new dggRecord(inTime, script, speaker);
          records.push(rec);      
        }
      });
      if (records.length > 0) {
        console.log(records.length + "record(s) found.");
        //レンダラーに一括挿入
        this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示
        this.setDirtyFlag(true); //ダーティフラグを立てる
      }
    } else if (dgg1Match != null && dgg1Match.length == 1) {
      console.log("Format is do-gagan 1.0.");
      //ShiftJISで再読み込み
      var reader = fs.createReadStream(pth)
          .on('error', (err)=>{reject(err)})
          .pipe(iconv.decodeStream("windows-31j")
          .collect((err,body)=>{
            //console.log(body);
            lines = body.split((/\r\n|\r|\n/));
            lines.forEach( line => {
              if (line.length == 0) return;
              const cols = line.split('\t');
              const inTime = this.HHMMSSTosec(cols[0]);
              const script = cols[1];
              console.log(`inTime:${inTime} script:${script}`);
              const rec = new dggRecord(inTime, script, 0);
              records.push(rec);
            });
            if (records.length > 0) {
              console.log(records.length + "record(s) found.");
              //レンダラーに一括挿入
              this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示
              this.setDirtyFlag(true); //ダーティフラグを立てる
            }          
            }))
    } else {
      console.log("No known format found.");
    }

    // const lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし

    // for (var line of lines) {
    //   var cols = line.split("\t");
    //   if (isFinite(cols[0]) == true && cols[0].length > 0){ //第一カラム（タイムスタンプ）が数値か判定
    //     let rec = new dggRecord(cols[0], cols[1], cols[2]);
    //     //tempRecords.push(rec);
    //     records.push(rec);
    //   } else {
    //     //第一カラムが数値でなければスキップ
    //     console.log('Invalid line: ' + line);
    //   };
    // }

    //this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示

    
    //this.setDirtyFlag(false); //ダーティフラグをクリア
}

  /**
   * SRT形式の字幕ファイルをインポート
   * @param {*} pth ファイルのパス
   * @param {*} clear trueなら既存のログを削除
   */
   importSrtFile(pth, clear = false) {
    if (clear == true) {
      this.clearLog();
    }
    let text = fs.readFileSync(pth, "utf8");
    let lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし

    //console.log("Format is Premiere transcribed txt.");
    lines= [];
    //改行2連続を1ブロックとして分割
    const pRecords = text.toString().split(/\r\n\r\n|\r\r|\n\n/);
    pRecords.forEach(r => {
      const line = r.split(/\r\n|\r|\n/);
      if (line.length == 3) { //3行に満たないレコードは除外
        const tc = line[1].split(" --> ")[0].split(",");

        const inTime = this.HHMMSSTosec(tc[0].match(/\d\d:\d\d:\d\d/)[0]);
        const script = line[2];
        const speaker = 0; //SRTに含まれないので常に0とする

        // console.log("inTime: " + inTime);
        // console.log("script: " + script);
        // console.log("speaker: " + speaker);
        const rec = new dggRecord(inTime, script, speaker);
        records.push(rec);      
      }
    });
    if (records.length > 0) {
      console.log(records.length + "record(s) found.");
      //レンダラーに一括挿入
      this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示
      this.setDirtyFlag(true); //ダーティフラグを立てる
    }
}

/**
   * Premiere Proのマーカーcsv形式のファイルをインポート
   * @param {*} pth ファイルのパス
   * @param {*} clear trueなら既存のログを削除
   */
importPremiereMarkerCSVFile(pth, clear = false) {
  //console.log("Format is Premiere Pro Marker CSV.");
  if (clear == true) {
    this.clearLog();
  }
  let text = fs.readFileSync(pth, "UTF16LE");
  let lines = text.toString().split(/\r\n|\r|\n/); //macOSで動作確認すべし

  lines.forEach( line => {
    if (line.length == 0) return;
    const regex = /[0-9]{2};[0-9]{2};[0-9]{2};/;
    const cols = line.split('\t');
    if (regex.test(cols[2])){
      const col2 = cols[2].split(";");
      const inTime = this.HHMMSSTosec(`${col2[0]}:${col2[1]}:${col2[2]}`);
      const script = cols[0];
      const rec = new dggRecord(inTime, script, 0);
      records.push(rec);
    } else {
      //第3項が"hh;mm;ss"形式でなければスキップ
      console.log('Invalid line: ' + line);
      return;
    }
  });
  if (records.length > 0) {
    console.log(records.length + "record(s) found.");
    //レンダラーに一括挿入
    this.mainWin.webContents.send('add-records-to-list',records); //レンダラーに描画指示
    this.setDirtyFlag(true); //ダーティフラグを立てる
  }
}

clearLog() {
  records.length = 0;
  this.mainWin.webContents.send('clear-records');
  this.isDirty = false;
}


/**
 * 未保存データ消える前にダイアログを出して処理する
 * @param {*} event 
 */
handleUnsavedLog(event) {
  if (this.isDirty == true) {
    const lang = this.config.get('locale') || app.getLocale();
    const _ = new i18n(lang, 'dialog');
    const options = {
      type: 'warning',
      buttons: [_.t('UNSAVED_DATA_SAVE'), _.t('UNSAVED_DATA_DISPOSE'), _.t('UNSAVED_DATA_CANCEL')],
      title: _.t('UNSAVED_DATA_TITLE'),
      message: _.t('UNSAVED_DATA_MESSAGE').replace('%1', path.basename(this.mediaPath).replace(path.extname(this.mediaPath),".dggn.txt")),
      defaultId: 3,
      cancelId: 2
    }; 
    switch (this.dialog.showConfirmation(options)) {
      case 0: //上書き保存して終了
        this.saveLog();
        this.clearLog();
        break;
      case 1: //破棄して終了
        this.clearLog();
        break;
      case 2: //キャンセル
        event.preventDefault();
        break;
    }
  }
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
      //console.log("backup file:" + shouldBackup);
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
      body += _.t('YOUTUBE_CHAPTER_GUIDE');
      body = body.replace('\n', ret);

      //先頭チャプターが0ではない場合、追加する
      if (parseInt(records[0].inTime) != 0){
        console.log("Adding 0 chapter.");
        body += this.secToYoutubeChapterTimeCode(0, this.mediaDuration) + ` ` + _.t('YOUTUBE_CHAPTER_START') + ret;
      };
    }

    //データ作成
    records.forEach(r => {

      switch (format) {
        case '1.0':
          //動画眼1.0形式
          body += this.secToHHMMSS(r.inTime) + `\t${r.script}${ret}`;
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

    //書き出し

    //1.0形式ではShiftJIS
    if (format == '1.0') {
        body = iconv.encode(body, 'Shift_JIS');
    }
    fs.writeFileSync(logpath, body);

    //上書き保存の時はダーティフラグをクリア
    if (pth.length == 0) { this.setDirtyFlag(false); }
  }

  /**
   * メニューから自動保存設定が変更されたら呼ばれる
   * @param {boolean} result 
   * @param {boolean} update //GUIから更新された時はtrueを指定し、保存する
   */
  toggleAutoSave(result, update = false) {
    //設定に保存
    if (update == true) {
      this.config.set('autoSaveSwitch', result);
    }

    //タイマーを無効化（リセット）
    //console.log("Disableing AutoSaveTimer.");
    clearInterval(autoSaveTimer);

    //trueの場合は新インターバルで再有効化
    if (result == true && this.autoSaveInterval != undefined) {
      //タイマーを有効化
      //console.log(`Enableing AutoSaveTimer. interval:${this.autoSaveInterval}`);
      autoSaveTimer = setInterval(()=> {
        //console.log(`Timer countup interval:${this.autoSaveInterval}`);
        //レコードが0の時、ダーティフラグが立ってない時はは自動保存をしない        
        if (records.length > 0 && this.isDirty == true) {
          this.saveLog('','2.0',true);
        }
      }, this.autoSaveInterval);
    }
  }

  //自動保存インターバル設定を読み込んで保持（起動時や設定更新時）
  setAutoSaveInterval(min) {
    this.autoSaveInterval = min * 60000; //60sec * 1000ms
    if (this.config != null) {
      this.toggleAutoSave(this.config.get('autoSaveSwitch'), false);  
    }
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

  secToHHMMSS(secTotal) {
    const hour = Math.floor(secTotal / 3600);
    const min = Math.floor((secTotal - (hour * 60)) / 60);
    const sec = secTotal - (hour * 3600) - (min * 60);
    return ( '00' + hour ).slice( -2 ) + ":" +( '00' + min ).slice( -2 ) + ":" + ( '00' + sec ).slice( -2 )
  }

  HHMMSSTosec(hhmmss) {
    //console.log(hhmmss);
    const e = hhmmss.split(":");
    if (e.length == 3) {
      return (parseInt(e[0]) * 3600) + (parseInt(e[1]) * 60) + parseInt(e[2]);
    } else {
      return 0;
    }
  }

  /**
   * 動画眼Lite形式のJSONファイルを出力
   * @returns 
   */
  exportLite() {
    const _ = new i18n(lang, 'dialog');
    const jsonPath = this.mediaPath.replace(path.extname(this.mediaPath), '.json.js');
    let options = null;
    //存在をチェックして確認
    if (fs.existsSync(jsonPath)) {
      options = {
        type: 'warning',
        buttons: [_.t('LITE_OK'), _.t('LITE_CANCEL')],
        title: _.t('LITE_JSON_TITLE'),
        message: _.t('LITE_JSON_MESSAGE').replace('%1', path.basename(jsonPath)),
        defaultId: 0,
        cancelId: 1,
        }; 
      if (this.dialog.showConfirmation(options) == 1) return; //上書き確認ダイアログでキャンセルを選んだら終了
    }

    //書き出し処理
    const title = path.basename(this.mediaPath) + " | 動画眼Lite";
    let body = "document.title=\"" + title + "\";\r\nconst scriptsJson = [\r\n";
    let charset = 'utf8';

    //データ作成
    records.forEach(r => {
        body += '\t{ in:' + r.inTime + ', script:"' + r.script.replace(/"/g,'&quot;').replace(/'/g,'&apos;') + '", speaker:' + r.speaker + ' },\n';
    });
    body = body.substring(0, body.length - 2); //末尾のカンマ、\r、\nの3文字を削る
    body += "\r\n];";
    //書き出し
    fs.writeFileSync(jsonPath, body);

    //HTMLファイルの準備
    
    //ダウンロード意志の確認
    options = {
      type: 'warning',
      buttons: [_.t('LITE_DOWNLOAD'), _.t('LITE_CANCEL')],
      title: _.t('LITE_SUCCESS_TITLE'),
      message: _.t('LITE_SUCCESS_MESSAGE').replace('%1', path.basename(jsonPath)),
      defaultId: 0,
      cancelId: 1,
    }; 
    if (this.dialog.showConfirmation(options) == 1) return; //上書き確認ダイアログでキャンセルを選んだら終了

    const htmlPath = this.mediaPath.replace(path.extname(this.mediaPath), '.html');
    //上書き確認
    if (fs.existsSync(htmlPath)) {
      options = {
        type: 'error',
        buttons: [_.t('LITE_OK'), _.t('LITE_CANCEL')],
        title: _.t('LITE_HTML_TITLE'),
        message: _.t('LITE_HTML_MESSAGE').replace('%1', path.basename(htmlPath)),
        defaultId: 0,
        cancelId: 1,
        }; 
    if (this.dialog.showConfirmation(options) == 1) return; //上書き確認ダイアログでキャンセルを選んだら終了
    }

    //サーバーからダウンロード
    const {download} = require("electron-dl");
    const dloptions = {
      directory: path.dirname(htmlPath),
      filename:path.basename(htmlPath),
    }
    download(this.mainWin, this.config.get('liteAutoDownloadURL'), dloptions).catch(err => {
      //ダウンロードエラー時の処理
      options = {
        type: 'error',
        buttons: [_.t('LITE_DOWNLOAD_MANUAL'), _.t('LITE_CANCEL')],
        title: _.t('LITE_DOWNLOAD_FAIL_TITLE'),
        message: _.t('LITE_DOWNLAOD_FAIL_MESSAGE').replace('%1', path.basename(jsonPath)),
        defaultId: 0,
        cancelId: 1,
      }; 
      if (this.dialog.showConfirmation(options) == 1) return;
      //ダウンロードページを開く
      const shell = require('electron').shell;
      shell.openExternal(this.config.get('liteManualDownloadURL'));
    })



}

  // #endregion

  setDirtyFlag(flag) {
    this.isDirty= flag;
    this.mainWin.webContents.send('update-dirty-flag', flag);
  }

  //1秒毎に呼ばれる
  getCurrentRecordId(position) {
    //TouchBarがある場合、スライダー位置を更新
    if (this.dggTouchBar != undefined) {
      this.dggTouchBar.updateKnobPosition(position / this.mediaDuration * 100);
    }

    //指定された再生時間を超えるinTimeをもつ最初のレコードの1つ前のidを返す
    const cur = records.find(r => r.inTime >= position);
    if (cur != undefined) {
       const rec = records[records.indexOf(cur) -1]; //1つ前
       if (rec != undefined) {
         return rec.id;
       } else {
         return undefined;
       }
      return records[records.indexOf(cur) -1].id;
    } else {
      return undefined;
    }
  }

  openSupportSite() {
    const shell = require('electron').shell;
    shell.openExternal('https://do-gugan.com/tools/do-gagan3/');
  }

  openMarkerPage() {
    const shell = require('electron').shell;
    shell.openExternal('https://do-gugan.com/tools/marker/');
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
  skipForwardToPlayer(event) {
    this.mainWin.webContents.send('skip-forward');
  }
  skipBackwardToPlayer(event) {
    this.mainWin.webContents.send('skip-backward');
  }
  playbackSpeedUp(event) {
    this.mainWin.webContents.send('playback-speed-up');
  }
  playbackSpeedDown(event) {
    this.mainWin.webContents.send('playback-speed-down');
  }
  playbackSpeedReset(event) {
    this.mainWin.webContents.send('playback-speed-reset');
  }
  changePositionFromSlider(pos) {
    this.mainWin.webContents.send('change-position-from-touchbar', pos);
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
      sandbox: false, //Electron20への一時対処
      enableRemoteModule: true,
      contextIsolation: true,
      preload: path.join(__dirname, './preload_settings.js'),
      accessibleTitle: _.t('SETTINGS_ACCESSIBLETITLE')
    }
  });
  settingsWindow.setMenu(null);
  settingsWindow.loadFile('settings.html');
  if (!this.app.isPackaged) {
    settingsWindow.setSize (settingsWindow.getSize()[0]+600, settingsWindow.getSize()[1]);
    settingsWindow.webContents.openDevTools(); //Devツールを開く
  }

  // レンダリングが完了したら呼ばれる
  settingsWindow.once('ready-to-show', () => {
    settingsWindow.show();
  });

  //ウインドウが閉じられる時呼ばれる
  settingsWindow.on('closed', () => {
    //console.log("settings window closed.");
    this.mainWin.webContents.send('load-config');
    settingsWindow = null;
  });
  return settingsWindow;
  };

  //--------------------------------
  // 時刻変換ダイアログウインドウ
  //--------------------------------
  openSyncTimeWindow() {
    const _ = new this.i18n(this.lang, 'dialog');
    let timeSyncWindow = new this.browserWindow({
      parent: this.mainWin,
      modal: true,
      width: 470,
      height: 260,
      backgroundColor: 'white',
      resizable: false,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      fullscreenable: false,
      skipTaskbar: true,
      show: false,
      title:_.t('SYNCTIME'),
      webPreferences: {
        worldSafeExecuteJavaScript: true,
        nodeIntegration: false,
        sandbox: false, //Electron20への一時対処
        enableRemoteModule: true,
        contextIsolation: true,
        preload: path.join(__dirname, './preload_syncTime.js'),
        accessibleTitle: _.t('SYNCTIME_ACCESSIBLETITLE')
      }
    });
    timeSyncWindow.setMenu(null);
    timeSyncWindow.loadFile('syncTime.html');

    if (!this.app.isPackaged) {
      timeSyncWindow.setSize (timeSyncWindow.getSize()[0]+600, timeSyncWindow.getSize()[1]);
      timeSyncWindow.webContents.openDevTools(); //Devツールを開く
    }
    // レンダリングが完了したら呼ばれる
    timeSyncWindow.once('ready-to-show', () => {
      timeSyncWindow.show();
    });

    //ウインドウが閉じられる時呼ばれるコールバック関数
     timeSyncWindow.on('closed', (offset) => {
    //   console.log("timeSync window closed.");
      timeSyncWindow = null;
     });
  };


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
        sandbox: false, //Electron20への一時対処
        enableRemoteModule: true,
        contextIsolation: true,
        preload: path.join(__dirname, './preload_replace.js'),
      //nativeWindowOpen: true, //Electron 18で廃止
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
      replaceWindow = null;
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
    this.setDirtyFlag(true);
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
    this.setDirtyFlag(true);
  }

  inTimeChanged(id,inTime) {
    records.find(r => r.id == id).inTime = inTime;
    this.setDirtyFlag(true);
  }

  speakerChanged(id,speaker) {
    records.find(r => r.id == id).speaker = speaker;
    this.setDirtyFlag(true);
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
    this.setDirtyFlag(true);
  }

  /**
   * コンテクストメニューからログ分割を実行
   * @param {Number} id 
   * @param {Number} index キャレット位置
   * @param {Number} length 選択文字数（1以上の時は分割不可）
   */
   splitLog(id, selectionStart, selectionEnd) {
    // console.log("split here");
    // console.log("id:" + id);
    // console.log("selectionStart:" + selectionStart);
    // console.log("selectionEnd:" + selectionEnd);
    const _ = new this.i18n(this.lang, 'dialog');
    if (selectionStart != selectionEnd) {
              //"1文字以上の文字を選択していると分割できません。",
              const options = {
                type: 'error',
                buttons: [_.t('SPLIT_OK')],
                title: _.t('SPLIT_ERROR'),
                message: _.t('CANNNOT_SPLIT_CHARACTER_SELECTED'),
                defaultId: 0,
                cancelId: 0,
              }; 
              if (this.dialog.showConfirmation(options) == 1) return; //上書き確認ダイアログでキャンセルを選んだら終了            
            } else if (selectionStart == 0) {
              //"この位置では分割できません。",
              const options = {
                type: 'error',
                buttons: [_.t('SPLIT_OK')],
                title: _.t('SPLIT_ERROR'),
                message: _.t('CANNNOT_SPLIT_HERE'),
                defaultId: 0,
                cancelId: 0,
              }; 
              if (this.dialog.showConfirmation(options) == 1) return; //上書き確認ダイアログでキャンセルを選んだら終了            
            } else {
              //分割実行
              const r = records.find(record => record.id==id);
              //console.log(`${r.inTime} ${r.script} ${r.speaker}`);
              const first = r.script.substr(0,selectionStart);
              const latter = r.script.substr(selectionStart);
              //console.log(`前半:${first}`);
              //1)既存idから後半文字列を除去
              this.memoChanged(id,first);

              //2)後半文字列で新規レコードを作成
              //console.log(`後半:${latter}`);
              const newInTime = parseInt(r.inTime) + 1;
              this.addNewMemoFromGUI(newInTime, latter, r.speaker); //ここでレンダラーのログも全更新される
            }              
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

//--------------------------------
// #region タイムスタンプ変換ダイアログ用
//--------------------------------

  /**
   * 現在のメディアファイル名を返す
   * @returns 開いているメディアファイルのファイル名
   */
  getMediaFileName() {
    let delimiter = '\\';
    //macOSの場合はデリミタを刺し替える
    if (process.platform == "darwin"){ delimiter = '/'; }
    const filename = this.mediaPath.substring(this.mediaPath.lastIndexOf(delimiter) + 1);
    return filename;
  }

  // getMediaBirthDateTime() {
  //   fs.stat(this.mediaPath, (err, stats) => {
  //     if (err) {
  //       console.error(err);
  //       result = err;
  //     } else {
  //       // ファイルの作成日時
  //       const birthtime = stats.birthtime.toLocaleString();  //2016-04-04T13:35:58.000Zで返るのをtoLocalString()でPCのロケールにあわせた時刻に変換
  //       return birthtime;
  //     }
  //   }).then(birthtime =>{return birthtime;
  //   });
  // }

  async getMediaBirthDateTime() {
    try {
      // awaitで非同期処理の結果を待つ
      const stats = await stat(this.mediaPath);
      // ファイルの作成日時
      const birthtime = stats.birthtime.toLocaleString();
      return birthtime;
    } catch (err) {
      console.error(err);
      return err;
    }
  }


  // #endregion

showAbout = function() {
  const openAboutWindow = require('about-window').default;
  openAboutWindow({ 
      icon_path: this.app.isPackaged ? path.join(process.resourcesPath, '/icon.png') : path.join(__dirname, 'build/icon.png'),
      //copyright: 'Copyright (c) 2021 Kazuyoshi Furuta,Do-gagan',
      package_json_dir: __dirname,
      //BrowserWindow: this.mainWin,
  });
}

closeWindow = function() {
  this.mainWin.close();
}

}


module.exports = new Common();
