/**
 * ダイアログ関連
 *
 */

//--------------------------------
// モジュール
//--------------------------------
const { app, dialog, remote } = require('electron');
const common = require('./common');
const config = require('./config');
const i18n = require('./i18n');
const path = require('path');

//--------------------------------
// グローバル変数
//--------------------------------
const locale = config.get('locale')       // 「言語」の設定情報を取得
const _ = new i18n(locale, 'dialog')      // ダイアログ用のテキスト情報をロード
const _d = new i18n(locale, 'default')     // デフォルトのテキスト情報をロード


/**
 * 「今すぐ再起動しますか」ダイアログ
 *
 * @param {object} win
 */
const reboot = function(win){
  const dialogOpts = {
    type: 'info',
    buttons: [_.t('BUTTON-REBOOT'), _.t('BUTTON-LATER')],
    message: _.t('REBOOT_CONFIRM_TITLE'),
    detail: _.t('REBOOT_CONFIRM_DETAIL')
  }

  // すぐに再起動するか確認
  dialog.showMessageBox(win, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0){
      app.relaunch()    // 再起動の準備
      app.exit(0)       // アプリ終了
    }
  })
}

/**
 * アバウト画面を表示
 */
const openAboutDialog = function() {
  p = require('./package.json');
  let re = dialog.showMessageBox(common.mainWin, {
    title:_.t('ABOUT'),
    message: _d.t('APPNAME') + '3' ,
    detail: 'Ver.'+ p.version + '\r©' + _d.t('AUTHOR')
  });
  //console.log(re);
}

/**
 * 動画／音声を開くファイルダイアログを表示
 */
const openVideoDialog = function() {
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
    switch (this.showConfirmation(options)) {
      case 0: //上書き保存して開く
        common.saveLog();
        break;
      case 1: //破棄して開く
        break;
      case 2: //キャンセル
        return;
    }
  }

  let result = dialog.showOpenDialogSync(common.mainWin, {
    title: _.t('OPEN_VIDEO_TITLE'),
    //defaultPath:"",
    //message: "", //masOS only 
    properties: ['openFile'],
    filters: [
      { name: _.t('MEDIAFILES'), extensions: ['mp4','mp3','wav','webm','ogv','ogg'] },
      //{ name: _.t('ALLFILES'), extensions: ['*'] },
    ]
  });
  if (result != undefined) {
    //common.app.createWindow();
    common.clearLog();
    common.openMediaFile(result[0]);
  }
}


/**
 * ログファイルを開くダイアログを表示
 */
 const openLog = function() {
  let result = dialog.showOpenDialogSync(common.mainWin, {
    title: _.t('OPEN_LOG_FILE'),
    defaultPath: path.dirname(common.mediaPath),
    //message: "", //masOS only 
    properties: ['openFile'],
    filters: [
      { name: _.t('MULTI_EXTENTIONS'), extensions: ['txt','csv','srt'] },
      { name: _.t('LOGFILES'), extensions: ['dggn.txt'] },
      { name: _.t('PREMIERE_TXT'), extensions: ['txt'] },
      { name: _.t('PREMIERE_MARKER_CSV'), extensions: ['csv'] },
      { name: _.t('SRT_FILE'), extensions: ['srt'] }
    ]
  });
  if (result != undefined) {
    let format = '';
    if (result[0].endsWith('.dggn.txt')) {
      //動画眼2.0形式ログ
      common.openLogFile(result[0], false);
    } else if (result[0].endsWith('.txt')) {
      //その他の.txt拡張子の形式
      common.importLogFile(result[0], false);
    } else if (result[0].endsWith('.csv')) {
      //Premier Pro マーカーCSVファイル
      common.importPremiereMarkerCSVFile(result[0], false);
    } else if (result[0].endsWith('.srt')) {
      //srt形式ファイル
      common.importSrtFile(result[0], false);
    }
  }
}

/**
 * ログファイルの別名保存ダイアログを表示
 */
 const saveLogAs = function() {
  let savePath = dialog.showSaveDialogSync(common.mainWin, {
    title: _.t('SAVE_LOG_FILE_AS'),
    defaultPath:path.dirname(common.mediaPath),
    filters: [
      { name: _.t('LOGFILES'), extensions: ['dggn.txt'] },
      { name: _.t('LOGFILES1'), extensions: ['txt'] },
      { name: _.t('YOURUBE_CHAPTER'), extensions: ['youtube.txt'] },
    ]
  });
  if (savePath != undefined) {
    let format = '';
    if (savePath.endsWith('.dggn.txt')) {
      format = '2.0';
    } else if (savePath.endsWith('.youtube.txt')) {
      format = 'youtube';
    } else {
      format = '1.0';
    }
    console.log(format);
    common.saveLog(savePath, format, false);
  }
}

const showConfirmation = function(options) {
  const result = dialog.showMessageBoxSync(common.mainWin, options);
  return result;
}

//--------------------------------
// exports
//--------------------------------
module.exports = {
  reboot: reboot,
  openAboutDialog: openAboutDialog,
  openVideoDialog: openVideoDialog,
  openLog: openLog,
  saveLogAs: saveLogAs,
  showConfirmation: showConfirmation,
}