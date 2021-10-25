/**
* レンダラープロセス（replace.html）用のJavaScriptファイル
*/
"use strict";
let locale = null;
let _ = null;


// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');
    console.log(`settings.js: ${locale}`);

    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Legend_FunctionTemplates').innerHTML = _.t('FunctionTemplates',locale);
    document.getElementById('Lbl_TemplateGuideT').innerHTML = _.t('SNIPPET_GUIDE_T',locale);
    document.getElementById('Lbl_TemplateGuideC').innerHTML = _.t('SNIPPET_GUIDE_C',locale);
    document.getElementById('Btn_Reset').innerHTML = _.t('RESET',locale);

    document.getElementById('Lbl_AutoSave_before').innerHTML = _.t('AUTOSAVE_BEFORE',locale);
    document.getElementById('Lbl_AutoSave_after').innerHTML = _.t('AUTOSAVE_AFTER',locale);
    document.getElementById('Lbl_AutoLockOn_after').innerHTML = _.t('AUTO_LOCKON_AFTER',locale);
    document.getElementById('Lbl_MultiplySkipTime_before').innerHTML = _.t('MULTIPLY_SKIPTIME_BEFORE',locale);
    document.getElementById('Lbl_MultiplySkipTime_after').innerHTML = _.t('MULTIPLY_SKIPTIME_AFTER',locale);
    document.getElementById('Lbl_Guide1').innerHTML = _.t('SKIPTIME_GUIDE',locale);

    document.getElementById('Btn_Close').value = _.t('CLOSE',locale);
    //設定をロード
    window.api.getConfig('functionSnippet1').then((result)=>{ document.getElementById('Txt_templateF1').value = result;});
    window.api.getConfig('functionSnippet2').then((result)=>{ document.getElementById('Txt_templateF2').value = result;});
    window.api.getConfig('functionSnippet3').then((result)=>{ document.getElementById('Txt_templateF3').value = result;});
    window.api.getConfig('functionSnippet4').then((result)=>{ document.getElementById('Txt_templateF4').value = result;});
    window.api.getConfig('functionSnippet5').then((result)=>{ document.getElementById('Txt_templateF5').value = result;});
    window.api.getConfig('autoSaveInterval').then((result)=>{ document.getElementById('Txt_AutoSave').value = result;});
    window.api.getConfig('autoLockOn').then((result)=>{ document.getElementById('Chk_AutoLoclOn').checked = result;});
    window.api.getConfig('multiPlyJump').then((result)=>{ document.getElementById('Txt_MultiplySkipTime').value = result;});


})();

function close() {
    window.close();
}

async function execute() {
    const before = document.getElementById('Txt_search').value;
    const after = document.getElementById('Txt_replace').value;
    window.api.executeRaplace(before,after);
}
