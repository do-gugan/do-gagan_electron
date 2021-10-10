/**
 * 共通オブジェクト、データ
**/
const i18n = require('./i18n');
const path = require('path');


//グローバルオブジェクト
const mainWin = null; //メインウインドウハンドル
const lang = null;


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


//--------------------------------
// exports
//--------------------------------
module.exports = {
    mainWin: mainWin,
    //updateWindowTitle: updateWindowTitle,
    openMediaFile: openMediaFile,
    toggleNewMemoBlockFromMenu: toggleNewMemoBlockFromMenu,
}

