/**
 * ユーザー設定
 *
 */

//--------------------------------
// モジュール
//--------------------------------
const { app } = require('electron');
const Store = require('electron-store')
const i18n = require('./i18n');
const lang = app.getLocale();
const _ = new i18n(lang, 'default');

const store = new Store({
  schema:{
    locale:{
      type: 'string',
      default: 'jp',
      minLength: 2,
      maxLength: 6
    },
    skipForwardIndex: {
      type: 'number',
      default: 5,
      minimum: 0,
      maximum: 9
    },
    skipBackwardIndex: {
      type: 'number',
      default: 5,
      minimum: 0,
      maximum: 9
    },
    functionSnippet1: {
      type: 'string',
      default: _.t('F1_DEFAULT'),
    },
    functionSnippet2: {
      type: 'string',
      default: _.t('F2_DEFAULT'),
    },
    functionSnippet3: {
      type: 'string',
      default: _.t('F3_DEFAULT'),
    },
    functionSnippet4: {
      type: 'string',
      default: _.t('F4_DEFAULT'),
    },
    functionSnippet5: {
      type: 'string',
      default: _.t('F5_DEFAULT'),
    },
    autoSaveInterval: {
      type: 'number',
      default: 5,
      minimum: 1,
    },
    autoSaveSwitch: {
      type: 'boolean',
      default: false,
    },
    autoLockOn_click: {
      type:'boolean',
      default: true,
    },
    autoLockOn_skip: {
      type:'boolean',
      default: true,
    },
    autoLockOn_type: {
      type:'boolean',
      default: true,
    },
    autoLockOn_speaker: {
      type:'boolean',
      default: false,
    },
    autoLockOn_snippets: {
      type:'boolean',
      default: true,
    },
    autoLockOn_snippets: {
      type:'boolean',
      default: false,
    },
    multiPlyJumpIndex: {
      type: 'number',
      default: 2,
      minimum: 0,
      maximum: 5,
    },
    windowSizeWidth: {
        type: 'number',
        default: 1024,
        minimum: 800,
    },
    windowSizeHeight: {
        type: 'number',
        default: 700,
        minimum: 600,
    },
    windowPosTop: {
        type: 'number',
        minimum: 0,
    },
    windowPosLeft: {
        type: 'number',
        minimum: 0,
    },
    newMemoBlockShown: {
      type: 'boolean',
      default: true,
    },
    autoScroll: {
      type: 'boolean',
      default: true,
    },
    backupFile: {
      type: 'boolean',
      default: true,
    },
    liteAutoDownloadURL: {
      type: 'string',
      default: 'https://github.com/do-gugan/do-gagan_lite/releases/latest/download/index.html',
    },
    liteManualDownloadURL: {
      type: 'string',
      default: 'https://github.com/do-gugan/do-gagan_lite/releases/latest/',
    },
    scrollPositionOfFocusedRow: {
      type: 'string',
      default: 'center',
    },

}
});

/**
 * 設定情報を返却
 *
 * @param {string} key
 * @return {any|undefined}
 */
 function get(key) {
  // if( key in Config ){
  //   return( Config[key] )
  // }
  // return(undefined)
  return store.get(key);
}

/**
 * 設定情報を記録
 *
 * @param {string} key
 * @param {any} value
 * @return {boolean}
 */
function set(key, value) {
  //console.log(`key: ${key} value: ${value} (` + typeof value +`)`);
  if(typeof key !== 'string' || value === undefined){
    return(false);
  }
  try{
    store.set(key, value); //保存
    //Config[key] = value; //参照用プロパティ更新
    return(true);
  }
  catch(e){
    console.log(`exp:` + e.message);
    return(e);
  }
}




//--------------------------------
// exports
//--------------------------------
module.exports = {
  get: get,
  set: set
}