/**
 * 共通オブジェクト、データ
**/
const i18n = require('./i18n');

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
 * Playerにvideo/audioタグをセット
 * @param {string} path メディアファイルのフルパス
 * @example
 *   openMediaFile(path);
 */
function openVideoFile(path) {
    this.mainWin.webContents.send('open-video', path);
}
function openAudioFile(path) {
    this.mainWin.webContents.send('open-audio', path);
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
    openVideoFile: openVideoFile,
    openAudioFile: openAudioFile,
    toggleNewMemoBlockFromMenu: toggleNewMemoBlockFromMenu,
}

