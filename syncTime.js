/**
* レンダラープロセス（syncTime.html）用のJavaScriptファイル
*/
"use strict";
let locale = null;
let _ = null;


// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');
    console.log(`syncTime.js: ${locale}`);

    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Lbl_inputStartTime').innerHTML = _.t('INPUT_START_TIME',locale);
    document.getElementById('Btn_getFileCreationTime').innerHTML = _.t('GET_FILE_CREATION_TIME',locale);
    document.getElementById('Btn_getFileName').innerHTML = _.t('GUESS_FROM_FILE_NAME',locale);
    document.getElementById('Btn_convert').innerHTML = _.t('CONVERT',locale);

})();

//フィル生成時刻を取得
function getFromCreationTime(){

}

//ファイル名にある時刻を抽出
function GuessFromFileName(){
    
}


//以下不要
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

async function execute() {
    const before = document.getElementById('Txt_search').value;
    const after = document.getElementById('Txt_replace').value;
    window.api.executeRaplace(before,after);
}
