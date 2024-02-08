/**
* レンダラープロセス（replace.html）用のJavaScriptファイル
*/
"use strict";
let locale = null;
let _ = null;


// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');
    console.log(`replace.js: ${locale}`);

    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Lbl_guide').innerHTML = _.t('REPLACE_GUIDE',locale);
    document.getElementById('Lbl_search').innerHTML = _.t('REPLACE_SEARCH',locale);
    document.getElementById('Lbl_replace').innerHTML = _.t('REPLACE_REPLACE',locale);
    document.getElementById('Lbl_match').innerHTML = _.t('REPLACE_MATCHED',locale);
    document.getElementById('Btn_cancel').innerHTML = _.t('REPLACE_CANCEL',locale);
    document.getElementById('Btn_execute').innerHTML = _.t('REPLACE_EXECUTE',locale);

    document.getElementById('Txt_search').focus();

})();

/**
 * 検索欄に文字が入力されたらヒット数をメインプロセスに問い合わせて結果を表示
 */
async function wordChanged() {
    const word = document.getElementById('Txt_search').value;
    if (word.length > 0){
        window.api.getMatchCount(word).then(count =>{
            document.getElementById('Lbl_count').innerText = count;
        })    
    } else {
        document.getElementById('Lbl_count').innerText = "0";
    }
}

function cancel() {
    window.close();
}

async function execute() {
    const before = document.getElementById('Txt_search').value;
    const after = document.getElementById('Txt_replace').value;
    window.api.executeRaplace(before,after);
    wordChanged(); //置換後のヒット数を更新
}
