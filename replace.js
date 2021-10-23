/**
* レンダラープロセス（replace.html）用のJavaScriptファイル
*/
"use strict";
let locale = null;
let _ = null;

// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');
    console.log("replace.js:"+ locale);

    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Lbl_guide').innerHTML = _.t('REPLACE_GUIDE',locale);
    document.getElementById('Lbl_search').innerHTML = _.t('REPLACE_SEARCH',locale);
    document.getElementById('Lbl_replace').innerHTML = _.t('REPLACE_REPLACE',locale);
    document.getElementById('Lbl_match').innerHTML = _.t('REPLACE_MATCHED',locale);
    document.getElementById('Btn_cancel').innerHTML = _.t('REPLACE_CANCEL',locale);
    document.getElementById('Btn_execute').innerHTML = _.t('REPLACE_EXECUTE',locale);
})();

function wordChanged() {
    //console.log(document.getElementById('Txt_search').value);
}

function cancel() {
    window.close();
}

function execute() {
    
}
