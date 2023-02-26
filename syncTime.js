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

//ファイル生成時刻を取得
const getFromCreationTime = ()=>{
    console.log("getFromCreationTime");
    window.api.getMediaBirthDateTime().then(birthDateTime =>{
        console.log(birthDateTime);
        const startTime = birthDateTime.split(" ")[1].split(":");
        document.getElementById("Txt_hh").value = startTime[0];
        document.getElementById("Txt_mm").value = startTime[1];
        document.getElementById("Txt_ss").value = startTime[2];
});
}

//ファイル名にある時刻を抽出
const GuessFromFileName = ()=>{
    console.log("GuessFromFileName");
    window.api.getMediaFileName().then(fname =>{
        //console.log("Media File Name: "+fname);
        const regex = /\b([0-9]{2}-[0-9]{2}-[0-9]{2})/;        
        if (regex.test(fname)) {
            const startTime = fname.match(regex)[0].split("-");
            document.getElementById("Txt_hh").value = startTime[0];
            document.getElementById("Txt_mm").value = startTime[1];
            document.getElementById("Txt_ss").value = startTime[2];
        } else {
            alert(_.t('GUESS_FROM_FILENAME_FAILED',locale));
        }
    });
}

//オフセットを計算して補正を実行
const convertTC = ()=>{
    const hh = document.getElementById("Txt_hh").value;
    const mm = document.getElementById("Txt_mm").value;
    const ss = document.getElementById("Txt_ss").value;
    const offset = hh*3600 + mm*60 + ss;
    console.log("Offset:"+offset+"sec");
}