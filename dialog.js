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
  p = require('./package.json');
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
    common.openMediaFile(result[0]);
  }
}



//--------------------------------
// exports
//--------------------------------
module.exports = {
  reboot: reboot,
  openAboutDialog: openAboutDialog,
  openVideoDialog: openVideoDialog,
}