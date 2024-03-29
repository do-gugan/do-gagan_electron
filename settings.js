﻿/**
* レンダラープロセス（replace.html）用のJavaScriptファイル
*/
"use strict";

let locale = null;
let _ = null;


// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');

    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Legend_FunctionTemplates').innerText = _.t('FUNCTION_SNIPPETS',locale);
    document.getElementById('Lbl_TemplateGuideT').innerText = _.t('SNIPPET_GUIDE_T',locale);
    document.getElementById('Lbl_TemplateGuideC').innerText = _.t('SNIPPET_GUIDE_C',locale);
    document.getElementById('Btn_Reset').innerText = _.t('RESET',locale);

    document.getElementById('Lbl_AutoSave_before').innerText = _.t('AUTOSAVE_BEFORE',locale);
    document.getElementById('Lbl_AutoSave_after').innerText = _.t('AUTOSAVE_AFTER',locale);

    document.getElementById('Lbl_AutoLockOn_Title').innerText = _.t('AUTO_LOCKON_TITLE',locale);
    document.getElementById('Lbl_AutoLockOn_click').innerText = _.t('AUTO_LOCKON_CLICK',locale);
    document.getElementById('Lbl_AutoLockOn_skip').innerText = _.t('AUTO_LOCKON_SKIP',locale);
    document.getElementById('Lbl_AutoLockOn_type').innerText = _.t('AUTO_LOCKON_TYPE',locale);
    document.getElementById('Lbl_AutoLockOn_speaker').innerText = _.t('AUTO_LOCKON_SPEAKER',locale);
    document.getElementById('Lbl_AutoLockOn_snippets').innerText = _.t('AUTO_LOCKON_SNIPPETS',locale);
    document.getElementById('Lbl_AutoLockOn_addmemo').innerText = _.t('AUTO_LOCKON_ADDMEMO',locale);
    
    document.getElementById('Lbl_MultiplySkipTime_before').innerText = _.t('MULTIPLY_SKIPTIME_BEFORE',locale);
    document.getElementById('Lbl_MultiplySkipTime_after').innerText = _.t('MULTIPLY_SKIPTIME_AFTER',locale);
    document.getElementById('Lbl_Guide1').innerText = _.t('SKIPTIME_GUIDE',locale);

    document.getElementById('Btn_Close').innerText = _.t('CLOSE',locale);

    //設定をロード
    window.api.getConfig('functionSnippet1').then((result)=>{ document.getElementById('Txt_templateF1').value = result;});
    window.api.getConfig('functionSnippet2').then((result)=>{ document.getElementById('Txt_templateF2').value = result;});
    window.api.getConfig('functionSnippet3').then((result)=>{ document.getElementById('Txt_templateF3').value = result;});
    window.api.getConfig('functionSnippet4').then((result)=>{ document.getElementById('Txt_templateF4').value = result;});
    window.api.getConfig('functionSnippet5').then((result)=>{ document.getElementById('Txt_templateF5').value = result;});
    window.api.getConfig('autoSaveInterval').then((result)=>{ document.getElementById('Txt_AutoSave').value = result;});
    window.api.getConfig('autoLockOn_click').then((result)=>{ document.getElementById('Chk_AutoLockOn_click').checked = result;});
    window.api.getConfig('autoLockOn_skip').then((result)=>{ document.getElementById('Chk_AutoLockOn_skip').checked = result;});
    window.api.getConfig('autoLockOn_type').then((result)=>{ document.getElementById('Chk_AutoLockOn_type').checked = result;});
    window.api.getConfig('autoLockOn_speaker').then((result)=>{ document.getElementById('Chk_AutoLockOn_speaker').checked = result;});
    window.api.getConfig('autoLockOn_snippets').then((result)=>{ document.getElementById('Chk_AutoLockOn_snippets').checked = result;});
    window.api.getConfig('autoLockOn_addmemo').then((result)=>{ document.getElementById('Chk_AutoLockOn_addmemo').checked = result;});
    window.api.getConfig('multiPlyJumpIndex').then((result)=>{ document.getElementById('Sel_MultiplySkipTime').selectedIndex = result;});


})();

/**
 * スニペットが編集されたら呼ばれる
 * @param {string} fnum 'F1'～'F5' 
 */
function changeSnippet(fnum) {
    switch(fnum) {
        case "F1":
            window.api.setConfig('functionSnippet1',document.getElementById('Txt_templateF1').value);
            break;
        case "F2":
            window.api.setConfig('functionSnippet2',document.getElementById('Txt_templateF2').value);
            break;
        case "F3":
            window.api.setConfig('functionSnippet3',document.getElementById('Txt_templateF3').value);
            break;
        case "F4":
            window.api.setConfig('functionSnippet4',document.getElementById('Txt_templateF4').value);
            break;
        case "F5":
            window.api.setConfig('functionSnippet5',document.getElementById('Txt_templateF5').value);
            break;
    }
}

//スニペットを初期化
function resetSnippets() {
    document.getElementById('Txt_templateF1').value = _.t_def('F1_DEFAULT');
    document.getElementById('Txt_templateF2').value = _.t_def('F2_DEFAULT');
    document.getElementById('Txt_templateF3').value = _.t_def('F3_DEFAULT');
    document.getElementById('Txt_templateF4').value = _.t_def('F4_DEFAULT');
    document.getElementById('Txt_templateF5').value = _.t_def('F5_DEFAULT');
    changeSnippet('F1');
    changeSnippet('F2');
    changeSnippet('F3');
    changeSnippet('F4');
    changeSnippet('F5');
}

function changeAutoSaveDur() {
    window.api.setConfig('autoSaveInterval',parseInt(document.getElementById('Txt_AutoSave').value));
    window.api.setAutoSaveIntervalOnMemory(); //即時反映
}

function changeAutoLocSetting(trigger) {
    if (trigger == 'click' || trigger == 'skip' || trigger == 'type' || trigger == 'speaker' || trigger == 'snippets' || trigger == 'addmemo'){
        //console.log(document.getElementById('Chk_AutoLockOn_'+trigger).checked);
        window.api.setConfig('autoLockOn_'+trigger,document.getElementById('Chk_AutoLockOn_'+trigger).checked);    
    }
}

function changeMultiplyJumpSec() {
    window.api.setConfig('multiPlyJumpIndex',parseInt(document.getElementById('Sel_MultiplySkipTime').selectedIndex));
}

function closeSettings() {
    //console.log("close");
    window.close();
}
