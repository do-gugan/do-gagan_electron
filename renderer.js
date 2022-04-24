/**
* レンダラープロセス（index.html）用のJavaScriptファイル
*/
"use strict";

//グローバルオブジェクト
let locale;
let _; //ローカライズ文字列取得用
let player; //videoタグ
let playerBox = document.getElementById("player-box");
let memolist = document.getElementById("scripts");
let lastFocusedRow; //最後の選択された行のdivエレメント

//各種設定をオンメモリで保持する
let functionSnippet1 = null;
let functionSnippet2 = null;
let functionSnippet3 = null;
let functionSnippet4 = null;
let functionSnippet5 = null;
let autoLockOn= true;
let multiPlyJumpIndex = 2;
let multiPlyJumpTimes = 2;
let lastMemoLength = 0; //メモを打ち始めかどうか判定するフラグ
let isShiftKeyPressing = false;
let currentMarkerTimer = null;
let markedRowId = null;
let scrollPositionOfFocusedRow = null;

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
    locale = await window.api.getConfig('locale');
    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Txt_Search').placeholder = _.t('SEARCH_PLACEHOLDER',locale);
    document.getElementById('Opt_Filter').innerHTML = _.t('FILTER',locale);
    document.getElementById('Opt_Emphasise').innerHTML = _.t('EMPHASISE',locale);
    playerBox.innerHTML = '<div id="placeholderWrapper"><div id="placeholderInPlayer">' + _.t('DROP_HERE',locale) + '</div></div>';
    document.getElementById('Lbl_ShowHideNewMemo').innerHTML = _.t('NEW_MEMO_FIELD',locale);
    document.getElementById('Lbl_AutoScroll').innerHTML = _.t('AUTO_SCROLL',locale);
    document.getElementById('Sel_BackwardSec').innerHTML = updateJumpSecOptions();
    document.getElementById('Sel_ForwardSec').innerHTML = updateJumpSecOptions();

    document.getElementById('Lbl_lockedTimecode').innerHTML = _.t('TIMECODE',locale);
    document.getElementById('Lbl_speaker').innerHTML = _.t('SPEAKER',locale);
    document.getElementById('Lbl_memo').innerHTML = _.t('MEMO',locale);

    document.getElementById('Btn_add').innerHTML = _.t('ADD',locale);

    //UI要素にツールチップ（title属性）を付加
    document.getElementById('lockedTimecode').title = _.t('TIPS_LOCKED_TIMECODE', locale);
    document.getElementById('speaker').title = _.t('TIPS_SPEAKER', locale);
    document.getElementById('function_buttons').title = _.t('TIPS_FUNCTION_BUTTONS', locale);
    document.getElementById('Btn_ScreenShot').title = _.t('TIPS_SCREEN_SHOT', locale);
    document.getElementById('Btn_JumpBackward').title = _.t('TIPS_JUMP_BACLWARD', locale);
    document.getElementById('Btn_PlayPause').title = _.t('TIPS_PLAY_PAUSE', locale);
    document.getElementById('Btn_JumpForward').title = _.t('TIPS_JUMP_FORWARD', locale);
    document.getElementById('search-box1').title = _.t('TIPS_SEARCH_METHOD', locale);
    document.getElementById('Label_ShowHideNewMemo').title = _.t('TIPS_TOGGLE_NEW_MEMO', locale);
    document.getElementById('Label_AutoScroll').title = _.t('TIPS_TOGGLE_AUTO_SCROLL', locale);

    //設定をグローバル変数に読み込み
    await loadConfig();

    //キーボードイベント
    //アプリ全体で効くコマンド
    document.body.addEventListener('keydown', (event)=>{
        if (event.shiftKey) {
            isShiftKeyPressing = true;
            //console.log(`isShiftKeyPressing: ${isShiftKeyPressing}`);
        }
    });

    //Premiere式再生速度制御の配列
    const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 4.0, 8.0];
    let currentPlaybackRate = 3; //上記配列の何番目を挿すか。

    document.body.addEventListener('keyup', (event)=>{
        // console.log("Ctrl:"+event.ctrlKey + " Alt:" + event.altKey + " Shift:"+ event.shiftKey);
        //console.log("Key:" + event.shiftKey);
        if (event.shiftKey) {
            isShiftKeyPressing = false;
            console.log(`isShiftKeyPressing: ${isShiftKeyPressing}`);
        }

        //Ctrl+LまたはAlt+Lでロックオン
        if ((event.ctrlKey || event.altKey) && event.key == 'l') {
            lockedTimeClicked();
        //Enter/Ctrl+←/→で話者コードの増減
        } else if ((event.ctrlKey || event.altKey) && event.key == 'ArrowRight') {
            incrementSpeaker();
        } else if ((event.ctrlKey || event.altKey) && event.key == 'ArrowLeft') {
            decrementSpeaker();
        } else if (event.key == 'F1' || event.key == 'F2' || event.key == 'F3' || event.key == 'F4' || event.key == 'F5') {
            inputFromFunctionTemplate(event.key);
        } else if (document.activeElement.nodeName != "INPUT" && document.activeElement.nodeName != "TEXTAREA" && player != undefined) {
            //テキスト入力欄以外でのキーイベント
            //Premiere ProのJ/K/Lキーを再現
            if (event.key == "l") {
                if (player.paused == true) {
                    player.play();
                } else {
                    if (currentPlaybackRate < playbackRates.length) { currentPlaybackRate++; }
                    console.log(playbackRates[currentPlaybackRate] + "x");
                    player.playbackRate = playbackRates[currentPlaybackRate];
                }
            } else if (event.key == "k") {
                currentPlaybackRate = 3;
                player.playbackRate = 1.0;
                togglePlayPause();
            } else if (event.key == "j") {
                if (player.paused != true) {
                    if (currentPlaybackRate > 0) { currentPlaybackRate--; }                
                    console.log(playbackRates[currentPlaybackRate] + "x");
                    player.playbackRate = playbackRates[currentPlaybackRate];
                } else {
                    currentPlaybackRate = 2;
                    player.playbackRate = playbackRates[currentPlaybackRate];
                    player.play();
                }
            }
        }
    });
    
    //メモ欄でリターンで「追加」ボタン代用
    document.getElementById('Txt_memo').addEventListener('keypress', (event)=>{
        if (event.code == 'Enter'){
            addMemo();
        }

    })



    //空欄からの打ちはじめの場合、自動ロックオンを発動
    document.getElementById('Txt_memo').addEventListener('input', (event)=>{
        const Memo = document.getElementById('Txt_memo').value;
        if (lastMemoLength == 0 && Memo.length > 0) {
            doAutoLockOn('type');
        }
        lastMemoLength = Memo.length;
    })

    //初期ウインドウタイトル（バージョン表示）
    document.title = _.t('APPNAME') + "3 Ver." + window.api.getAppVersion();

    await loadConfig();//設定をロード
    
})();

//起動時、設定を呼び出して画面に反映させる
async function loadConfig() {
    //console.log('Loading Settings...');
    await window.api.getConfig('functionSnippet1').then((result) => { functionSnippet1 = result;});
    await window.api.getConfig('functionSnippet2').then((result) => { functionSnippet2 = result;});
    await window.api.getConfig('functionSnippet3').then((result) => { functionSnippet3 = result;});
    await window.api.getConfig('functionSnippet4').then((result) => { functionSnippet4 = result;});
    await window.api.getConfig('functionSnippet5').then((result) => { functionSnippet5 = result;});
    document.getElementById('Btn_F1').innerText = "F1: " + functionSnippet1.replace('$t','').replace('$c','');
    document.getElementById('Btn_F2').innerText = "F2: " + functionSnippet2.replace('$t','').replace('$c','');
    document.getElementById('Btn_F3').innerText = "F3: " + functionSnippet3.replace('$t','').replace('$c','');
    document.getElementById('Btn_F4').innerText = "F4: " + functionSnippet4.replace('$t','').replace('$c','');
    document.getElementById('Btn_F5').innerText = "F5: " + functionSnippet5.replace('$t','').replace('$c','');

    await window.api.getConfig('autoLockOn').then((result) => { autoLockOn = result;});
    await window.api.getConfig('multiPlyJumpIndex').then((result) => {
        multiPlyJumpIndex = result;
        const multis = [0.1,0.5, 2, 3, 5, 10];
        multiPlyJumpTimes = multis[multiPlyJumpIndex];
    });

    await window.api.getConfig('scrollPositionOfFocusedRow').then((result) => { scrollPositionOfFocusedRow = result;});

    //スキップ秒数
    window.api.getConfig('skipForwardIndex').then(function(result){
        setSkipTime('forward', result); //GUI
        window.api.setSkipTimeFromGUI('forward', result); //メニュー
    });
    window.api.getConfig('skipBackwardIndex').then(function(result){
        setSkipTime('backward', result); //GUI
        window.api.setSkipTimeFromGUI('backward', result); //メニュー
    });

    //自動スクロール ON/OFF
    await window.api.getConfig('autoScroll').then((result) => {
        document.getElementById('Chk_AutoScroll').checked = result;
    });
    
    //メモ欄 表示/非表示
    await window.api.getConfig('newMemoBlockShown').then((result) => {
        document.getElementById('Chk_ShowHideNewMemo').checked = result;
        toglleNewMemoBlock();
    });
}
//メインプロセスで設定が変更されたら↑を呼んで反映
window.api.loadConfig(()=>loadConfig());

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
    const videotag = '<video id="player" onratechange="playbackRateChangedFromVideoElement();" autoplay controls><source src="' + path + '"></video>';
    playerBox.innerHTML = videotag;
    mediaOpened(path);
});
window.api.openAudio((event, path)=>{
    const audiotag = '<audio id="player" onratechange="playbackRateChangedFromVideoElement();" autoplay controls><source src="' + path + '"></audio>';
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
    player.addEventListener('seeked', (event) => playerSeeked() );
    player.addEventListener('durationchange', (event) => setMediaDuration() );

    //UIを有効化
    document.getElementById('Btn_ScreenShot').disabled = false;
    document.getElementById('Btn_JumpBackward').disabled = false;
    document.getElementById('Btn_PlayPause').disabled = false;
    document.getElementById('Btn_JumpForward').disabled = false;
    document.getElementById('Btn_JumpForward').disabled = false;
    document.querySelectorAll('.control_svg').forEach(svg => svg.style.fill="#444");

    document.getElementById('Txt_Search').disabled = false;

    document.getElementById('Btn_timecodeDecrement').disabled = false;
    document.getElementById('Btn_timecodeIncrement').disabled = false;
    document.getElementById('Txt_lockedTimecode').disabled = false;
    document.getElementById('Txt_memo').disabled = false;
    document.getElementById('Btn_add').disabled = false;

    document.getElementById('Btn_F1').disabled = false;
    document.getElementById('Btn_F2').disabled = false;
    document.getElementById('Btn_F3').disabled = false;
    document.getElementById('Btn_F4').disabled = false;
    document.getElementById('Btn_F5').disabled = false;
}

//メインプロセスから1件のレコードを表示
window.api.addRecordToList((record) => {
    const html = `<div class="row" id="${record.id}"><div class="inTime speaker${record.speaker}" onclick="timeClicked(event);" onContextmenu="openContextMenuOn(event)">${secToMinSec(record.inTime)}</div><div class="script"><textarea oninput="editTextarea(event.target);" onkeyup="keyupTextarea(event);" onContextmenu="openContextMenuOnText(event)">${record.script}</textarea></div></div>`;
    memolist.innerHTML += html;

    //セルの高さを文字数にあわせて調整
    const t = document.querySelector(`#${record.id} .script textarea`);
    resizeTextarea(t);
});

//まとまった数のレコードを一括で追加
window.api.addRecordsToList((records) => {
    let html = "";
    records.forEach(r => {
        html += `<div class="row" id="${r.id}"><div class="inTime speaker${r.speaker}" onclick="timeClicked(event);" onContextmenu="openContextMenuOn(event)">${secToMinSec(r.inTime)}</div><div class="script"><textarea oninput="editTextarea(event.target);" onkeyup="keyupTextarea(event);" onContextmenu="openContextMenuOnText(event)">${r.script}</textarea></div></div>`;
    });
    memolist.innerHTML = html;

    //セルの高さを文字数にあわせて調整
    const textareas = document.querySelectorAll(`.script textarea`);
    textareas.forEach(ta => resizeTextarea(ta));
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
    //フォーカス更新タイマーを発火
    currentMarkerTimer = setInterval(updateCurrentMarker, 1000);
}

function playerPaused() {
    //フォーカス更新タイマーを停止
    clearInterval(currentMarkerTimer);
}

//再生中の行をフォーカス表示
function updateCurrentMarker() {
    //現在の再生点に近い行を問い合わせ
    window.api.getCurrentRecordId(player.currentTime).then((curId)=>{
        if (curId != undefined) {
            //現在フォーカスされている行を戻す
            const lastFocus = document.getElementById(lastFocusedRow);
            if (lastFocusedRow != undefined) {lastFocusedRow.classList.remove('focused');}
            lastFocusedRow = document.getElementById(curId);
            if (lastFocusedRow != undefined) {lastFocusedRow.classList.add('focused');}

            //特定のレコードをフォーカスしていない時は自動でセンタースクロール
            var ae = document.activeElement.parentElement.parentElement;
            if (ae != undefined && ae.id.startsWith('row')){
            } else {
                if (document.getElementById("Chk_AutoScroll").checked == true){
                    lastFocusedRow.scrollIntoView({behavior: "smooth", block: scrollPositionOfFocusedRow});
                }
            }
        }
    })
}



function playerSeeked() {
    doAutoLockOn('skip');
    updateCurrentMarker();
}
/* #endregion */

function setMediaDuration() {
    window.api.setMediaDuration(player.duration);
}

async function changeWindowTitle(path, isDirty = false) {
    let delimiter = '\\';
    //macOSの場合はデリミタを刺し替える
    window.api.isDarwin().then((isDarwin)=> {
        if ( isDarwin== true) {
            delimiter = '/';
        }
        const filename = path.substring(path.lastIndexOf(delimiter) + 1);
        document.title = _.t("APPNAME",locale) + "3 | " + filename;
    });
}

//----------------------------------------------------
//#region 画面下部の新規メモ欄(#bottom）の制御
//----------------------------------------------------

/**
* 新規メモ欄の表示／非表示を切り替え
* （設定保存はメインプロセス呼んだ先で）
*/
const toglleNewMemoBlock = function () {
    const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
    if (checkbox.checked == true) {
        document.getElementById('main').style.gridTemplateRows = "2.5em 1fr 3em 6em";
        window.api.toggleNewMemoBlockMenu(true);
    } else {
        document.getElementById('main').style.gridTemplateRows = "2.5em 1fr 3em 0.5em";
        window.api.toggleNewMemoBlockMenu(false);
    }
}

/**
* メインプロセスからのプッシュで新規メモ欄の表示／非表示を切り替え、結果をboolで返す
*/
window.api.toggleNewMemoBlockFromMenu((result)=>{
    const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
    const main = document.getElementById('main');
    if (result === true) {
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
    //メニューから変更した場合の設定保存はmenu.jsのtoggleNewMemoBlockFromMenuで。
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
function skipForward(event = null){
    var sec = document.getElementById('Sel_ForwardSec').value;
    if (isShiftKeyPressing == true) {
        sec = sec * multiPlyJumpIndex
    }
    jumpToTimeIndex(parseFloat(player.currentTime) + parseFloat(sec));
}
function skipBackward(event = null){
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
    skipTimeChanged(direction, true); //設定を保存
}

/**
 * スキップ秒数の設定を反映／記憶する
 * メニューからもGUIからも呼ばれるので、反映はループしないようfromMenuで判定
 * @param {*} direction 'forward' or 'backward'
 * @param {*} fromMenu メニューから呼ばれた時はtrue
 */
const skipTimeChanged = (direction, fromMenu=false) => {
    //console.log(`skipTimeChanged direction:${direction} fromMenu:${fromMenu}`);
    let idx = 0;
    let key = '';
    if (direction=='forward') {
        idx = document.getElementById('Sel_ForwardSec').selectedIndex;
        key = 'skipForwardIndex';
    } else if (direction == 'backward') {
        idx = document.getElementById('Sel_BackwardSec').selectedIndex;
        key = 'skipBackwardIndex';
    }
    //console.log(`skipTimeChanged(direction: ${direction} fromMenu: ${fromMenu} index: ${idx})`);
    //保存
    //idx = parseInt(idx); //Numberに変換
    window.api.setConfig(key,idx);
    //メニューに反映
    if (fromMenu === false) {
        window.api.setSkipTimeFromGUI(direction, idx);
    }

}

/**
 * 再生速度がプルダウンメニューで変更された
 */
const playbackRateChanged = () => {
    player.playbackRate = document.getElementById('Sel_PlaybackRate').value;
}

// videoエレメントUIで速度変更された時にプルダウンメニューを同期する
const playbackRateChangedFromVideoElement = () => {
    //console.log('再生レートが変わりました。'+ player.playbackRate);
    document.getElementById('Sel_PlaybackRate').value = player.playbackRate;
};

//メインプロセス（メニュー）から
window.api.skipForward(()=>skipForward()); //スキップ実行
window.api.skipBackward(()=>skipBackward()); //スキップ実行
window.api.setSkipTime((direction, index)=>setSkipTime(direction, index)); //スキップ設定をselectに反映
//動画再生位置を指定秒に移動する
function jumpToTimeIndex(sec){
    //document.getElementById('body').focus();
    player.currentTime = sec;
    player.play();
    //doAutoLockOn('skip'); //メディアのseekedイベントから呼ぶので不要
}
window.api.updateDirtyFlag((flag)=> {
    //console.log('updateDirtyFlag:' + flag);
    let newTitle = document.title;
    if (!newTitle.endsWith('*') && flag == true){
        newTitle += '*';
    } else if (newTitle.endsWith('*') && flag == false) {
        newTitle = newTitle.substring(0, newTitle.length -1);
    }
    document.title = newTitle;

});

//TouchBarのスライダー操作を受け付ける
window.api.changePositionFromTouchbar((pos) => {
    //console.log(`${pos}% = ` + player.duration * pos / 100);
    jumpToTimeIndex(player.duration * pos /100);
});

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


/**
 * 自動ロックオンを発動すべきか設定を確認して判断 
 * @param {string} trigger 6種類のトリガータイプいずれか
 * @returns 更新を実施した時はtrue
 */
async function doAutoLockOn(trigger) {
    //console.log("doAutoLockOn trigger: "+trigger);
    if (trigger == 'click' || trigger == 'skip' || trigger == 'type' || trigger == 'speaker' || trigger == 'snippets' || trigger == 'addmemo'){
        await window.api.getConfig('autoLockOn_'+trigger).then((result) => {
            //console.log(result);
            if (result == true ) { syncTimecode(); }
            return result;
        });
    } else {
        return false;
    }
}



/* #endregion */

//----------------------------------------------------
// #region レコードセル関連
//----------------------------------------------------

/**
 * タイムコードがクリックされたら当該シーンにジャンプする
 */
function timeClicked(event) {
    //console.log(event.key);
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

function keyupTextarea(event) {
    if (event.key == 'Escape') {
        event.target.blur();
    }
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

//ログのタイムコード上の右クリックでコンテクストメニューを表示
function openContextMenuOn(e) {
    e.preventDefault();
    const id = e.target.parentElement.id;
    window.api.openContextMenuOn(id);
}

//ログのタイムコード上の右クリックでコンテクストメニューを表示
function openContextMenuOnText(e) {
    e.preventDefault();
    const id = e.target.parentElement.parentElement.id;
    window.api.openContextMenuOnText(id, e.target.selectionStart , e.target.selectionEnd);
}


//メインプロセスからリスト上の指定ID行の話者クラスを変更
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


/**
 * フィルター機能
 */
function searchWordChanged() {
    const word = document.getElementById('Txt_Search').value;
    const method = document.getElementById('Sel_SearchMethod').value;
    resetSearch();
    if (word){
        //let start = new Date().getTime();
        const rows = document.querySelectorAll('.row'); //全行の配列
        switch (method){
            case "filter":
                //wordを含まないものを非表示にする
                [...rows].forEach(row => { //NodeListオブジェクトrowsを配列に変換して列挙（スプレッド構文）
                    if (!row.querySelector('textarea').value.includes(word)){
                        row.classList.add('filtered');               
                    }
                });
                break;
            case "emphasise":
                //wordを含むものを強調する
                [...rows].forEach(row => { //NodeListオブジェクトrowsを配列に変換して列挙（スプレッド構文）
                    const ta = row.querySelector('textarea');
                    if (ta.value.includes(word)){
                        ta.classList.add('emphasised');
                    }
                });
                break;
        }
        //console.log("Time " +(new Date().getTime()-start)+"msec");            
    }
    document.getElementById('Txt_Search').focus();
}
//検索によって付加したスタイルをリセットする
function resetSearch() {    
    const rows = document.querySelectorAll('.row'); //全行の配列
    [...rows].forEach(row => {
        row.classList.remove('filtered');
        row.querySelector('textarea').classList.remove('emphasised');
    })
}

//メインプロセス（メニュー）から置換ウインドウを開く
window.api.openReplaceWindow(()=>{
    const childWindow = window.open('replace.html');
    //childWindow.document.write('<h1>Hello</h1>')
});

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
        doAutoLockOn('speaker');
    }
}
function incrementSpeaker() {
    let sp = parseInt(document.getElementById('Txt_speaker').value);
    if (sp < 7) {
        document.getElementById('Txt_speaker').classList.remove('speaker'+ sp);
        sp++;
        document.getElementById('Txt_speaker').value = sp;
        setSpeakerColor(sp);
        doAutoLockOn('speaker');
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

//タイムコード欄クリックまたはショートカットで、設定を確認してロックオン実行
async function lockedTimeClicked(){
    await window.api.getConfig('autoLockOn_click').then((result) => {
        if (result == true ) { syncTimecode(); }
    });
}

//自動ロックオン実行
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
            txt = functionSnippet1;
            break;
        case 'F2':
            txt = functionSnippet2;
            break;
        case 'F3':
            txt = functionSnippet3;
            break;
        case 'F4':
            txt = functionSnippet4;
            break;
        case 'F5':
            txt = functionSnippet5;
            break;                                        
    }

    txt =txt.replace('$t', memo.value);    //$tを現在のテキストボックスの文字列にリプレイス
    let cur = txt.indexOf('$c');    //$cの位置を記憶
    memo.value = txt.replace('$c',''); //$cを削除して文字を挿入
    if (cur != -1){
        memo.focus();
        memo.setSelectionRange(cur, cur); //カーソルを移動
    }
    doAutoLockOn('snippets');
}


//GUIからメインプロセスに新規メモ内容を送信
async function addMemo() {    
    await doAutoLockOn('addmemo'); //オートロックオンでタイムコードが更新されるなら待つ。

    const inTime = minSecToSec(document.getElementById('Txt_lockedTimecode').value);
    const script = document.getElementById('Txt_memo').value;
    const speaker = document.getElementById('Txt_speaker').value;
    window.api.addNewMemoFromGUI(inTime, script, speaker);
    document.getElementById('Txt_memo').value = "";
    lastMemoLength = 0;
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

//自動スクロールのチェックボックス状態を設定に保存
function toglleAutoScroll(){
    const result = document.getElementById("Chk_AutoScroll").checked;
    window.api.setConfig("autoScroll", result);
}