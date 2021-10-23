/**
* レンダラープロセス（index.html）用のJavaScriptファイル
*/
"use strict";

//const dggRecord = require("./dggRecord");

//グローバルオブジェクト
let locale;
let _; //ローカライズ文字列取得用
let player; //videoタグ
let playerBox = document.getElementById("player-box");
let memolist = document.getElementById("scripts");
let lastFocusedRow; //最後の選択された行のdivエレメント

//対応形式
const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg', //ogv
    'audio/mpeg', //mp3
    'audio/wav',
    'audio/ogg'
];           


// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    //const locale = await window.requires.ipcRenderer.invoke('getConfig', 'locale');
    locale = await window.api.getConfig('locale');
    //locale = 'en';
    _ = window.api;
    document.getElementById('Lbl_Search').innerHTML = _.t('SEARCH',locale) + ":";
    document.getElementById('Btn_SearchClear').textContent = _.t('CLEAR',locale);
    playerBox.innerHTML = '<div id="placeholderWrapper"><div id="placeholderInPlayer">' + _.t('DROP_HERE',locale) + '</div></div>';
    document.getElementById('Lbl_ShowHideNewMemo').innerHTML = _.t('NEW_MEMO_FIELD',locale);
    document.getElementById('Sel_BackwardSec').innerHTML = updateJumpSecOptions();
    document.getElementById('Sel_ForwardSec').innerHTML = updateJumpSecOptions();

    document.getElementById('Lbl_lockedTimecode').innerHTML = _.t('TIMECODE',locale);
    document.getElementById('Lbl_speaker').innerHTML = _.t('SPEAKER',locale);
    document.getElementById('Lbl_memo').innerHTML = _.t('MEMO',locale);

    document.getElementById('Btn_add').innerHTML = _.t('ADD',locale);

    document.getElementById('Btn_F1').innerHTML = "F1: " + eliminateTemplateCode(_.t('F1_DEFAULT',locale));
    document.getElementById('Btn_F2').innerHTML = "F2: " + eliminateTemplateCode(_.t('F2_DEFAULT',locale));
    document.getElementById('Btn_F3').innerHTML = "F3: " + eliminateTemplateCode(_.t('F3_DEFAULT',locale));
    document.getElementById('Btn_F4').innerHTML = "F4: " + eliminateTemplateCode(_.t('F4_DEFAULT',locale));
    document.getElementById('Btn_F5').innerHTML = "F5: " + eliminateTemplateCode(_.t('F5_DEFAULT',locale));

    //キーボードイベント
    //アプリ全体で効くコマンド
    document.body.addEventListener('keyup', (event)=>{
        // console.log("Ctrl:"+event.ctrlKey + " Alt:" + event.altKey + " Shift:"+ event.shiftKey);
        // console.log("Key:" + event.key);

        //Ctrl+LまたはAlt+Lでロックオン
        if ((event.ctrlKey || event.altKey) && event.key == 'l') {
            syncTimecode();
        //Enter/Ctrl+←/→で話者コードの増減
        } else if ((event.ctrlKey || event.altKey) && event.key == 'ArrowRight') {
            incrementSpeaker();
        } else if ((event.ctrlKey || event.altKey) && event.key == 'ArrowLeft') {
            decrementSpeaker();
        } else if (event.key == 'F1' || event.key == 'F2' || event.key == 'F3' || event.key == 'F4' || event.key == 'F5') {
            inputFromFunctionTemplate(event.key);
        }
    });
    
    //メモ欄でリターンで「追加」ボタン代用
    document.getElementById('Txt_memo').addEventListener('keypress', (event)=>{
        if (event.code == 'Enter'){
            addMemo();
        }
    })

    //初期ウインドウタイトル（バージョン表示）
    document.title = _.t('APPNAME') + "3 Ver." + window.api.getAppVersion();
})();

/**
 * ファンクションキーテンプレート中の制御文字を除去
 * @param {string} str 
 * @returns $tと$cを除去した文字列
 */
function eliminateTemplateCode(str) {
    return str.replace('$t','').replace('$c','');
}

/**
* ジャンプ秒数セレクターの選択肢（optionタグ群）を生成
* @param (string) sec
*/
function updateJumpSecOptions(selected = '60') {
    let options = "";
    let sel = "";
    const secs = [3,5,10,15,30,60,120,180,300,600];
    for (const sec of secs){
        if (sec.toString() == selected) {
            sel =" selected"
        } else {
            sel ="";
        }
        options += '<option value="' + sec.toString() + '"' + sel + '>' + _.t(sec.toString(), locale) + '</option>\r\n';
    }
    return options;
}

//--------------------------------
// //#region メディアファイル再生周り
//--------------------------------
//メインプロセスからのプッシュでメディアファイルを開く
window.api.openVideo((event, path)=>{           
    const videotag = '<video id="player" autoplay controls><source src="' + path + '"></video>';
    playerBox.innerHTML = videotag;
    mediaOpened(path);
});
window.api.openAudio((event, path)=>{
    const audiotag = '<audio id="player" autoplay controls><source src="' + path + '"></audio>';
    playerBox.innerHTML = audiotag;
    mediaOpened(path);
});


//メディアを開いた時の共通処理
function mediaOpened (path) {
    //console.log('mediaOpened:'+path);
    player = document.getElementById("player");            

    //ファイル名をウインドウタイトルに
    changeWindowTitle(path);

    //プレーヤーからのイベントリスナーを登録
    player.addEventListener('play', (event) => playerPlayed() );
    player.addEventListener('pause', (event) => playerPaused() );

    //ボタンを有効化
    document.getElementById('Btn_ScreenShot').disabled = false;
    document.getElementById('Btn_JumpBackward').disabled = false;
    document.getElementById('Btn_PlayPause').disabled = false;
    document.getElementById('Btn_JumpForward').disabled = false;

    document.getElementById('Btn_timecodeDecrement').disabled = false;
    document.getElementById('Btn_timecodeIncrement').disabled = false;
    document.getElementById('Txt_lockedTimecode').disabled = false;
    document.getElementById('Txt_memo').disabled = false;
    document.getElementById('Btn_add').disabled = false;

}

//メインプロセスからレコードを表示
window.api.addRecordToList((record) => {
    //console.log("displayRecords" + record.timeStamp);
    const html = '<div class="row" id="'+record.id+'"><div class="inTime speaker'+record.speaker+'" onclick="timeClicked(event);" onContextmenu="openContextMenuOn(event)">'+secToMinSec(record.inTime)+'</div><div class="script"><textarea oninput="editTextarea(event.target);">'+record.script+'</textarea></div></div>';
    memolist.innerHTML += html;

    //セルの高さを文字数にあわせて調整
    const t = document.querySelector('#' + record.id + ' .script textarea');
    resizeTextarea(t);
});
//秒インデックスを「分：秒」形式に変換
function secToMinSec(secTotal){
    const min = Math.floor(secTotal / 60);
    const sec = secTotal - min*60;
    return ( '00' + min ).slice( -2 ) + ":" + ( '00' + sec ).slice( -2 )
}


//ファイルのドラッグ&ドロップを受け付ける
//参考元: https://archive.craftz.dog/blog.odoruinu.net/2016/09/01/get-files-via-drag-and-drop-from-desktop/index.html
//標準動作をキャンセル
playerBox.ondragover = document.ondrop = function (e) {
    e.preventDefault();
}
//dragEnterエフェクト開始
playerBox.ondragenter = document.ondrop = function (e) {
    const ph = document.getElementById("placeholderInPlayer");
    //既にメディアファイルを開いている場合はphが消滅しているのでundefinedになる
    if (ph != undefined) {
        playerBox.classList.add("dragging");
        if (e.dataTransfer.items.length > 1) {
            ph.innerText = _.t('DROP_ONLY_SINGLE_FILE',locale);
        } else if (!validTypes.includes(e.dataTransfer.items[0].type)) {
            ph.innerHTML = _.t('INVALID_FILETYPE',locale);
        } else {
            ph.innerHTML = _.t('DROP_AND_OPEN',locale);
        }
    }

}
//dragLeaveでエフェクトを解除
playerBox.ondragleave = document.ondrop = function (e) {
    playerBox.classList.remove("dragging");
    const ph = document.getElementById("placeholderInPlayer");
    if (ph != undefined) {
        ph.innerHTML = window.api.t('DROP_HERE',locale);
    }

}
//ドロップされたファイルを開く
document.body.addEventListener('drop', function (e) {
    if (validTypes.includes(e.dataTransfer.items[0].type)) {
        window.api.openDroppedFile(e.dataTransfer.files[0].path);
    }
});



//----------------------------------------------------
//#region プレーヤーのイベントハンドラー（状態変化検知）系
//----------------------------------------------------
function playerPlayed() {

}

function playerPaused() {

}
/* #endregion */


async function changeWindowTitle(path) {
    const filename = path.substring(path.lastIndexOf('\\') + 1); //macOSだとどうなる？
    document.title = _.t("APPNAME",locale) + "3 | " + filename;
}

//----------------------------------------------------
//#region 画面下部の新規メモ欄(#bottom）の制御
//----------------------------------------------------

/**
* 新規メモ欄の表示／非表示を切り替え
*/
const toglleNewMemoBlock = function () {
    const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
    if (checkbox.checked == true) {
        document.getElementById('main').style.gridTemplateRows = "2.5em 1fr 3em 6em";
        window.api.toggleNewMemoBlockMenu(true);
    } else {
        document.getElementById('main').style.gridTemplateRows = "2.5em 1fr 3em 0em";
        window.api.toggleNewMemoBlockMenu(false);
    }
}

/**
* メインプロセスからのプッシュで新規メモ欄の表示／非表示を切り替え、結果をboolで返す
*/
window.api.toggleNewMemoBlockFromMenu((event, result)=>{
    const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
    const main = document.getElementById('main');
    if (main.style.gridTemplateRows == "2.5em 1fr 3em 0em") {
        //非表示だったら表示
        main.style.gridTemplateRows = "2.5em 1fr 3em 6em";
        checkbox.checked = true;
        return true;
    } else {
        //表示だったら非表示
        main.style.gridTemplateRows = "2.5em 1fr 3em 0em";
        checkbox.checked = false;
        return false;
    }
});

// #endregion

//----------------------------------------------------
// #region 再生制御系ボタン
//----------------------------------------------------

//再生・一時停止（GUIから）
document.getElementById('Btn_PlayPause').addEventListener('click', function() {
    togglePlayPause();
});
//メインプロセス（メニュー）から
window.api.togglePlayPause(()=>{
    togglePlayPause();
});
//実際の処理
function togglePlayPause() {
    if(player != undefined) {
        //console.log('state:'+ player.paused);
        if (player.paused == true) {
            player.play();
        } else {
            player.pause();
        }
    }
}


//前後ジャンプ
function skipForward(sec = 0){
    var sec = document.getElementById('Sel_ForwardSec').value;
    jumpToTimeIndex(parseFloat(player.currentTime) + parseFloat(sec));
}
function skipBackward(sec = 0){
    var sec = document.getElementById('Sel_BackwardSec').value;
    jumpToTimeIndex(parseFloat(player.currentTime) - parseFloat(sec));
}
/**
 * メニューからスキップ秒数をセット
 * @param {string} direction 'forward'または'backward'
 * @param {Number} index 選択するする行番号
 */
function setSkipTime(direction, index) {
    //console.log('setSkipTime on Renderer:' + direction + " index:"+ index);
    let sel;
    if (direction == "forward") {
        sel = document.getElementById('Sel_ForwardSec');
    } else if (direction == "backward") {
        sel = document.getElementById('Sel_BackwardSec');
    }
    sel.selectedIndex = index;
}
//メインプロセス（メニュー）から
window.api.skipForward(()=>skipForward());
window.api.skipBackward(()=>skipBackward());
window.api.setSkipTime((direction, index)=>setSkipTime(direction, index));
//動画再生位置を指定秒に移動する
function jumpToTimeIndex(sec){
    //document.getElementById('body').focus();
    player.currentTime = sec;
    player.play();
    syncTimecode();
}

/** 秒インデックスを「分：秒」形式に変換
 * @param (Number) secTotal
 * @param (Number) minDigit 分の桁数（3を指定すると000:00）
 */
function secToMinSec(secTotal, minDigit = 2){
    const min = Math.floor(secTotal / 60);
    const sec = Math.floor(secTotal - min*60);
    let minSkel = '00';
    let sl = -2;
    if (minDigit == 3) {
        minSkel = '000';
        sl = -3
    }
    return ( minSkel + min ).slice( sl ) + ":" + ( '00' + sec ).slice( -2 )
}

//「分：秒」形式を秒に変換
function minSecToSec(minsec) {
    const d = minsec.split(":");
    return Number(d[0]*60) + Number(d[1]);
}

/* #endregion */



//----------------------------------------------------
// #region レコードセル関連
//----------------------------------------------------

/**
 * タイムコードがクリックされたら当該シーンにジャンプする
 */
function timeClicked(event) {
    const tcell = event.target;
    jumpToTimeIndex(minSecToSec(tcell.innerText)); //当該位置にジャンプ

    //既にフォーカスされた行がある場合はリセット
    if (lastFocusedRow != undefined) { lastFocusedRow.classList.remove('focused'); }
    
    //親エレメントにフォーカス枠のクラスを追加
    tcell.parentElement.classList.add('focused');
    lastFocusedRow = tcell.parentElement;
}


/** 
 * ログ欄のテキストが編集されたら、DBへ反映とリサイズ
 * @param (textarea) element
 */
function editTextarea(textarea){
    const id = textarea.parentElement.parentElement.id;
    //メインプロセスに変更を送る
    window.api.memoChanged(id, textarea.value);

    //リサイズ処理を呼ぶ
    resizeTextarea(textarea);
}
/**
 * ログが編集される時、文字数にあわせてセルの高さを調整する
 */
function resizeTextarea(textarea) {
    const initial_height = parseFloat(getComputedStyle(textarea).height)
    textarea.style.height = "0px"; //一瞬高さ0にすることでscrollHeightがリセットされる。これがないと増えた高さが戻らなくなる。
    textarea.style.height = (textarea.scrollHeight -3 ) + "px";
}
/**
 * ウインドウがリサイズされた時にログ欄のセル高を調整する
 * 高さは自動で増えるが、↑を呼ばないと狭まらない
 * #dragBarのドラッグイベントからも呼んでいる。
 */
function resizeAllTextArea() {
    var rows = document.querySelectorAll('.script textarea');
    for (const ta of rows) {
        resizeTextarea(ta);
    }
}        
window.addEventListener('resize',function(){
    resizeAllTextArea();
})

//行の右クリックでコンテクストメニューを表示
function openContextMenuOn(e) {
    e.preventDefault();
    const id = e.target.parentElement.id;
    window.api.openContextMenuOn(id);
}

//メインプロセスから指定ID行の話者クラスを変更
window.api.setSpeakerOfRow((id, speaker)=>{
    const el = document.querySelector('#'+ id + " .inTime");
    for (let i=0; i<8; i++){
        el.classList.remove("speaker" + i);
    }
    el.classList.add("speaker" + speaker);
})

//メインプロセスから指定ID行を削除
window.api.deleteRow((id)=>{
    document.querySelector('#'+ id).remove();
})




/** #region フレームのドラッグリサイズ
*  参考:https://codepen.io/lukerazor/pen/GVBMZK
*/
let isDragging = false;

function StartDrag() {
    isDragging = true;
    SetCursor("ew-resize");
}

function SetCursor(cursor) {
        playerBox.style.cursor = cursor;
}
function EndDrag() {
    isDragging = false;
    SetCursor("auto");
}

function OnDrag(event) {
    if (isDragging){
        //console.log("Dragging");
        //console.log(event);
        const main = document.getElementById("main");
        const totalWidthPx = main.clientWidth;
        const dragbarWidthPx = 5; //(px)

        let leftcol = playerBox;
        let rightcol = document.getElementById("search-box");	
        //console.log("total:"+totalWidthPx+"px");
        //console.log("player:"+playerBox.clientWidth+"px");
        //console.log("clientX:"+event.clientX+"px");
        let leftColWidth = Math.round((event.clientX / totalWidthPx) * 100);
        //console.log("percentage:"+leftColWidth+"%");
                    
        const newColDef = leftColWidth + "% 5px auto"; //左カラム、ドラッグボーダー、右カラム

        //各カラムの最小サイズをpxで判定
        const rightColWidthPx = (totalWidthPx - (totalWidthPx * leftColWidth /100) - dragbarWidthPx);
        const leftColWidthPx = (totalWidthPx * leftColWidth /100);
        if ( rightColWidthPx > 300 && leftColWidthPx > 232) {
            main.style.gridTemplateColumns = newColDef;
        }              
        resizeAllTextArea(); //ログのセル高をリサイズする
        event.preventDefault()
    }
}

/* #endregion */


//----------------------------------------------------
//#region 新規ログ欄（#bottom）内の制御
//----------------------------------------------------

// 話者コードを1～10で増減させるボタン
function decrementSpeaker() {
    let sp = parseInt(document.getElementById('Txt_speaker').value);
    if (sp > 0) {
        document.getElementById('Txt_speaker').classList.remove('speaker'+ sp);
        sp--;
        document.getElementById('Txt_speaker').value = sp;
        setSpeakerColor(sp);
    }
}
function incrementSpeaker() {
    let sp = parseInt(document.getElementById('Txt_speaker').value);
    if (sp < 7) {
        document.getElementById('Txt_speaker').classList.remove('speaker'+ sp);
        sp++;
        document.getElementById('Txt_speaker').value = sp;
        setSpeakerColor(sp);
    }
}
function setSpeakerColor(sp){
    if (sp < 8) {
        //話者カラー
        document.getElementById('Txt_speaker').classList.add('speaker'+sp);
    } else {
        //個別カラーがない番号はすべて0と同色
        document.getElementById('Txt_speaker').classList.add('speaker0');
    }
}

// タイムコードロックオン
function decrementTimecode() {
    let ct = minSecToSec(document.getElementById('Txt_lockedTimecode').value);
    if (ct > 0) {
        document.getElementById('Txt_lockedTimecode').value = secToMinSec(--ct,3);
        jumpToTimeIndex(ct);
    }
}
function incrementTimecode() {
    let ct = minSecToSec(document.getElementById('Txt_lockedTimecode').value);
    if (ct < player.duration) {
        document.getElementById('Txt_lockedTimecode').value = secToMinSec(++ct,3);
        jumpToTimeIndex(ct);
    }    
}
function syncTimecode() {
    if (player != undefined) {
        document.getElementById('Txt_lockedTimecode').value = secToMinSec(player.currentTime,3);
    } else {
        console.log("not playing");
    }
}

//ファクションキーテンプレート
/**
 * 
 * @param {string} key (F1～F5) 
 */
function inputFromFunctionTemplate(key) {
    let txt;
    const memo = document.getElementById('Txt_memo');
    switch (key) {
        case 'F1':
            txt = _.t('F1_DEFAULT',locale);           
            break;
        case 'F2':
            txt = _.t('F2_DEFAULT',locale);           
            break;
        case 'F3':
            txt = _.t('F3_DEFAULT',locale);           
            break;
        case 'F4':
            txt = _.t('F4_DEFAULT',locale);           
            break;
        case 'F5':
            txt = _.t('F5_DEFAULT',locale);           
            break;                                        
    }

    txt =txt.replace('$t', memo.value);    //$tを現在のテキストボックスの文字列にリプレイス
    let cur = txt.indexOf('$c');    //$cの位置を記憶
    memo.value = txt.replace('$c',''); //$cを削除して文字を挿入
    if (cur != -1){
        memo.focus();
        memo.setSelectionRange(cur, cur); //カーソルを移動
    }
}


//GUIからメインプロセスに新規メモ内容を送信
function addMemo() {    
    const inTime = minSecToSec(document.getElementById('Txt_lockedTimecode').value);
    const script = document.getElementById('Txt_memo').value;
    const speaker = document.getElementById('Txt_speaker').value;
    window.api.addNewMemoFromGUI(inTime, script, speaker);
    document.getElementById('Txt_memo').value = "";
}

//GUIからメインプロセスに動画の静止画キャプチャを送信
function sendCapturetoMain() {
    const canvas = document.createElement("canvas");
    //キャプチャするサイズ
    canvas.height = 720;
    //縦横比を維持して高さ720に変換
    canvas.width = 720 * (player.videoWidth / player.videoHeight);

    //ビデオの元解像度からキャプチャサイズにスケールして保存
    canvas.getContext('2d').drawImage(player, 0, 0, player.videoWidth, player.videoHeight,0,0,canvas.width,canvas.height);

    //メインプロセスに
    var dataURL = canvas.toDataURL("image/jpeg",0.8);
    window.api.saveCapture(dataURL, secToMinSec(player.currentTime));
}

//ログリストをクリア
window.api.clearRecords(()=>{
    memolist.innerHTML = "";
});