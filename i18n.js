/**
 * 翻訳クラス
 * https://blog.katsubemakito.net/nodejs/electron/electron-i18n
 */

//--------------------------------
// モジュール
//--------------------------------
import fs from 'node:fs';
import path from 'node:path';

//JSONはBOM付きの可能性があるため除去してからパースする
function readJson(filePath) {
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.charCodeAt(0) === 0xFEFF) { text = text.slice(1); } //BOM除去
  return JSON.parse(text);
}

const p = readJson(path.join(import.meta.dirname, 'package.json'));

//--------------------------------
// exports
//--------------------------------
/**
 * i18nクラス
 *
 * @example
 *   import i18n from './i18n.js'
 *   const _ = new i18n('ja', 'page1')
 *   console.log( _.t('foo') );
 */
export default class i18n{
  // 対応言語
  static SUPPORT_LANG = ['ja', 'en']

  // デフォルト言語
  static DEFAULT_LANG = 'ja'

  /**
   * コンストラクタ
   *
   * @param {string} lang 言語CD
   * @param {string} ns   ネームスペース
   * @param {string} dir  言語ファイルがあるディレクトリ
   */
  constructor(lang=null, ns='default', dir=null){
    if( lang === null || ! this.isSupport(lang) ){
      lang = i18n.DEFAULT_LANG
    }

    this._lang = lang   // 言語
    this._ns   = ns     // ネームスペース
    this._dir  = dir ?? path.join(import.meta.dirname, 'locales')   // 言語ファイルのディレクトリ
    this._dic  = null   // 翻訳データ入れ

    const ret = this.load()
    if( ! ret ){
      throw 'Can not load language file'
    }
  }

  /**
   * 言語ファイルを読み込む
   *
   * @return {boolean}
   */
  load(){
    const dir  = this._dir
    const lang = this._lang
    const ns   = this._ns

    try{
      this._dic = readJson(path.join(dir, lang, `${ns}.json`))
      return(true)
    }
    catch(e){
      return(false)
    }
  }

  /**
   * サポートしている言語かチェック
   *
   * @param {string} lang
   * @return {boolean}
   */
  isSupport(lang){
    return( i18n.SUPPORT_LANG.indexOf(lang) !== -1 )
  }

  /**
   * 指定言語のテキストを返却
   *
   * @param {string} key
   * @return {string|undefined}
   */
  t(key){
    if( key in this._dic ){
      let value = this._dic[key]
                          .replace('{{name}}', p.name);
      return( value )
    }
    return(undefined)
  }

  /**
   * 辞書全体を返却（プレースホルダー置換済み）
   * サンドボックス化されたpreloadへIPCで辞書を渡すために使用
   *
   * @return {Object}
   */
  getDictionary(){
    const out = {};
    for (const key in this._dic) {
      out[key] = this._dic[key].replace('{{name}}', p.name);
    }
    return(out)
  }
}