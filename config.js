/**
 * ユーザー設定
 *
 */

//--------------------------------
// モジュール
//--------------------------------
const Store = require('electron-store')
const store = new Store({
  schema:{
    locale:{
      type: 'string',
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
    }

  }
})

//--------------------------------
// グローバル変数
//--------------------------------
const Config = {
  locale: store.get('locale'),
  skipForwardIndex: store.get('skipForwardIndex'),
  skipBackwardIndex: store.get('skipBackwardIndex'),
}

/**
 * 設定情報を返却
 *
 * @param {string} key
 * @return {any|undefined}
 */
const get = (key) =>{
  if( key in Config ){
    return( Config[key] )
  }
  return(undefined)
}

/**
 * 設定情報を記録
 *
 * @param {string} key
 * @param {any} value
 * @return {boolean}
 */
const set = (key, value) =>{
  //console.log(`key: ${key} value: ${value} (` + typeof value +`)`);
  if(typeof key !== 'string' || value === undefined){
    return(false);
  }
  try{
    store.set(key, value); //保存
    Config[key] = value; //参照用プロパティ更新
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