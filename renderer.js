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
let isShiftKeyPressing = false; //GUIでスキップした時のShiftキー押下判定するフラグ
let currentMarkerTimer = null;
let markedRowId = null;
let scrollPositionOfFocusedRow = null;
let isPreviousFrameIsBlank = false; //黒ゴマ検出で連続検出を抑止するフラグ
let statusDisplayTimer = null; //ステータス表示を一定時間で消すためのタイマー

//対応形式
const validTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg', //ogv
    'audio/mpeg', //mp3
    'audio/wav',
    'audio/ogg'
];

//Premiere式再生速度制御の配列
const playbackRates = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 4.0, 8.0];
let currentPlaybackRate = 3; //上記配列の何番目を挿すか。

//OS判定フラグ
let isDarwin = '';
//console.log("UserAgent:" + window.navigator.userAgent);
if (window.navigator.userAgent.indexOf('Mac') !== -1) {
    isDarwin = 'macOS';
} else {
    isDarwin = 'not macOS';
}
//console.log("isDarwin:" + isDarwin);

// メインプロセスから言語環境を取得し、ページに必要なテキストを表示
(async ()=>{
    locale = await window.api.getConfig('locale');
    //locale = 'en'; //有効化で英語UIのテスト
    _ = window.api;
    document.getElementById('Txt_Search').placeholder = _.t('SEARCH_PLACEHOLDER',locale);
    document.getElementById('Opt_Filter').innerText = _.t('FILTER',locale);
    document.getElementById('Opt_Emphasise').innerText = _.t('EMPHASISE',locale);
    playerBox.setHTML('<div id="placeholderWrapper"><div id="placeholderInPlayer">' + _.t('DROP_HERE',locale) + '</div></div>'); //翻訳文内にHTMLタグがあるので、setHTMLで代入
    document.getElementById('Lbl_ShowHideNewMemo').innerText = _.t('NEW_MEMO_FIELD',locale);
    document.getElementById('Lbl_AutoScroll').innerText = _.t('AUTO_SCROLL',locale);
    document.getElementById('Sel_BackwardSec').setHTML(updateJumpSecOptions()); //HTMLで生成されるのでsetHTMLで代入
    document.getElementById('Sel_ForwardSec').setHTML(updateJumpSecOptions()); //HTMLで生成されるのでsetHTMLで代入

    document.getElementById('Lbl_lockedTimecode').innerText = _.t('TIMECODE',locale);
    document.getElementById('Lbl_speaker').innerText = _.t('SPEAKER',locale);
    document.getElementById('Lbl_memo').innerText = _.t('MEMO',locale);

    document.getElementById('Btn_add').innerText = _.t('ADD',locale);

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
        //console.log("Kaydown Ctrl:"+event.ctrlKey + " Alt:" + event.altKey + " Shift:"+ event.shiftKey);
        //console.log("Key:" + event.key);
        //console.log("isDarwin:" + isDarwin);
        if (event.shiftKey == true) {
            isShiftKeyPressing = true;
        }

        //macOSでOSショートカットのCtr+Aを上書き
        if (isDarwin == 'macOS' && event.metaKey && event.key==='a'){
            playbackSpeedDown();
            event.preventDefault();
        }
        //macOSでOSショートカットのCtr+Dを上書き
        if (isDarwin == 'macOS' && event.ctrlKey && event.key==='d'){
            playbackSpeedUp();
            event.preventDefault();
        }


        //WindowsでメニューアクセラレーターでCtr+Aが効かない問題の対応
        if (isDarwin == 'not macOS' && event.ctrlKey && event.key==='a'){
            playbackSpeedDown();
            event.preventDefault();
        }
    });

    document.body.addEventListener('keyup', (event)=>{
        //console.log("Keyup Ctrl:"+event.ctrlKey + " Alt:" + event.altKey + " Shift:"+ event.shiftKey);
        //console.log("Key:" + event.key);
        //console.log("isDarwin:" + isDarwin);
        if (event.shiftKey == false) {
            isShiftKeyPressing = false;
        }
        //WindowsでメニューアクセラレーターでCtr+Eが効かない問題の対応
        if (isDarwin == 'not macOS' && event.ctrlKey && event.key==='w'){
            togglePlayPause();
            event.preventDefault();
        }

        //Shiftキー押してn倍ジャンプ
        if ((event.ctrlKey && event.shiftKey) && event.key == 'E') {
            skipForwardBig();
        } else if ((event.ctrlKey && event.shiftKey) && event.key == 'Q') {
            skipBackwardBig();
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
                playbackSpeedUp();
            } else if (event.key == "k") {
                playbackSpeedReset();
            } else if (event.key == "j") {
                playbackSpeedDown();
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

/* プレーヤー右上の再生ステータス表示
* @param (string) message 表示するメッセージ
* @param (string) icon 表示するアイコン名
*/
function displayPlayerStatus(message,icon = "") {
    //タイマーをクリア
    clearTimeout(statusDisplayTimer);

    document.getElementById('player_status_text').innerText = message;
    //icon値が既知のものならSVGを表示、それ以外では消す
    let iconSVG = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    switch (icon) {
        case 'play':
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'svg/play.svg#play');
            break;
        case 'pause':
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'svg/pause.svg#pause');
            break;
        case 'forward':
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'svg/forward.svg#forward');
            break;
        case 'backward':
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'svg/backward.svg#backward');
            break;
        case 'camera':
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'svg/camera.svg#camera');
            break;
        default:
            iconSVG.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '');
            break;
    }
    document.getElementById('player_status_icon').textContent = '';
    document.getElementById('player_status_icon').appendChild(iconSVG);
}

/* プレーヤーの再生速度変更、状態を検知して表示を更新
*/
function preparePlayerRateChangeListener() {
    player.addEventListener('ratechange', (event) => {
        //ステータスアイコンを消す
        
        if (player.playbackRate != 1.0) {
        displayPlayerStatus('x' + player.playbackRate, '');
        } else {
            displayPlayerStatus('', '');
        }
    });

    player.addEventListener('play', (event) => {
        displayPlayerStatusForAWhile('', 'play',2);
    });
    player.addEventListener('pause', (event) => {
        displayPlayerStatusForAWhile('', 'pause',0); //無限に表示
    });
}

/* displayPlayerStatusを使ってメッセージを表示し、指定秒数後に元の表示に戻す
* @param (string) message 表示するメッセージ
* @param (string) icon 表示するアイコン名（play/pause/forward/backward/camera等。空ならアイコンを消す）
* @param (number) sec 秒数(0の場合は戻さない)
*/
function displayPlayerStatusForAWhile(message="", icon="", sec=0) {
    displayPlayerStatus(message, icon);
    if (sec != 0) {
        statusDisplayTimer = setTimeout(() => {
            //再生速度に応じた表示に戻す
            if (player.playbackRate != 1.0) {
                displayPlayerStatus('x' + player.playbackRate, '');
                } else {
                    displayPlayerStatus('', '');
                }
        }, sec * 1000);
    }
}

//--------------------------------
// //#region メディアファイル再生周り
//--------------------------------
//メインプロセスからのプッシュでメディアファイルを開く
function escapeMediaPath(path) {
    //let escapeMediaPath = encodeURI(`file:///${path.replace(/\\/g, '/')}`); //encodeURI doesn't work with #.
    let escapeMediaPath = `file:///${path.replace(/#/g, '%23').replace(/\\/g, '/').replace(/ /g, '%20')}`;
    return escapeMediaPath;
}
window.api.openVideo((event, path)=>{
    let video = document.createElement('video');
    video.id = 'player';
    video.autoplay = true;
    video.controls = true;
    video.onratechange = playbackRateChangedFromVideoElement;

    let source = document.createElement('source');
    source.src = escapeMediaPath(path);

    video.appendChild(source);

    let playerStatus = document.createElement('div');
    playerStatus.id = 'player_status';

    let playerStatusIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    playerStatusIcon.id = 'player_status_icon';

    let playerStatusText = document.createElement('div');
    playerStatusText.id = 'player_status_text';

    playerStatus.appendChild(playerStatusIcon);
    playerStatus.appendChild(playerStatusText);

    playerBox.textContent = '';
    playerBox.appendChild(video);
    playerBox.appendChild(playerStatus);
    
    mediaOpened(path);

    preparePlayerRateChangeListener();
});
window.api.openAudio((event, path)=>{
    let audio = document.createElement('audio');
    audio.id = 'player';
    audio.autoplay = true;
    audio.controls = true;
    audio.onratechange = playbackRateChangedFromVideoElement;

    let source = document.createElement('source');
    source.src = escapeMediaPath(path);

    audio.appendChild(source);

    let playerStatus = document.createElement('div');
    playerStatus.id = 'player_status';

    let playerStatusIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    playerStatusIcon.id = 'player_status_icon';

    let playerStatusText = document.createElement('div');
    playerStatusText.id = 'player_status_text';

    playerStatus.appendChild(playerStatusIcon);
    playerStatus.appendChild(playerStatusText);

    playerBox.textContent = '';
    playerBox.appendChild(audio);
    playerBox.appendChild(playerStatus);

    mediaOpened(path, true); //音声であることを第2引数trueで明示

    preparePlayerRateChangeListener();
});


/**メディアを開いた時の共通処理
 * @param {string} path
 * @param {boolean} isAudio //音声ファイルの時にスクショボタンを無効化するためのフラグ
*/
function mediaOpened (path, isAudio = false) {
    player = document.getElementById("player");            

    //ファイル名をウインドウタイトルに
    changeWindowTitle(path);

    //プレーヤーからのイベントリスナーを登録
    player.addEventListener('play', (event) => playerPlayed() );
    player.addEventListener('pause', (event) => playerPaused() );
    player.addEventListener('seeked', (event) => playerSeeked() );
    player.addEventListener('durationchange', (event) => setMediaDuration() );
    //player.addEventListener('timeupdate', (event) => AddChapeterForFrameBlank());

    //UIを有効化
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

    //動画か音声かでスクリーンショットボタンを切り替え
    document.getElementById('Btn_ScreenShot').disabled = isAudio;
}


//メモのテンプレートを作成
const rowDiv = document.createElement('div');
rowDiv.classList.add('row');

const inTimeDiv = document.createElement('div');
inTimeDiv.classList.add('inTime');

const scriptDiv = document.createElement('div');
scriptDiv.classList.add('script');

const scriptTextarea = document.createElement('textarea');
scriptTextarea.rows = 1;

scriptDiv.appendChild(scriptTextarea);
rowDiv.appendChild(inTimeDiv);
rowDiv.appendChild(scriptDiv);

// 新規レコードを作成
function createNewRecord(id, inTime, speaker, script) {
    const newRow = rowDiv.cloneNode(true);
    //cloneNodeで複製されないイベントリスナーを登録
    newRow.querySelector('.inTime').onclick = timeClicked;
    newRow.querySelector('.inTime').oncontextmenu = openContextMenuOn;
    newRow.querySelector('textarea').oninput = (event) => editTextarea(event.target);
    newRow.querySelector('textarea').onkeyup = keyupTextarea;
    newRow.querySelector('textarea').oncontextmenu = openContextMenuOnText;
    newRow.querySelector('textarea').onfocus = cellFocused;
    newRow.querySelector('textarea').onblur = cellBlured;

    //動的要素をセット
    newRow.id = id;
    newRow.querySelector('.inTime').classList.add('speaker' + speaker);
    newRow.querySelector('.inTime').innerText = secToMinSec(inTime);
    newRow.querySelector('textarea').value = script;

    return newRow;
}
/** メインプロセスから1件のレコードを表示
 * @param {record} r
**/
window.api.addRecordToList((r) => {
    //テンプレートを使って追加
    memolist.appendChild(createNewRecord(r.id, r.inTime, r.speaker, r.script));

    //セルの高さを文字数にあわせて調整
    resizeTextarea(newRow.querySelector('textarea'));
});

//まとまった数のレコードを一括で追加
window.api.addRecordsToList((records) => {
    records.forEach(r => {
        const newRecord = createNewRecord(r.id, r.inTime, r.speaker, r.script);
        memolist.appendChild(newRecord);
    });

    //全セルのappendが終わってからまとめてリサイズ
    const textareas = document.querySelectorAll(`.script textarea`);
    textareas.forEach(ta => resizeTextarea(ta, true));
});

//指定したエレメントの後ろにレコードを追加
window.api.insertRecordToList((newID, recJSON, targetId) => {
    //console.log("newID:" + newID + " recJSON:" + recJSON + " targetId:" + targetId);
    const record = JSON.parse(recJSON);
    const newRow = createNewRecord(newID, record.inTime, record.speaker, record.script);
    const target = document.getElementById(targetId);
    target.insertAdjacentElement('afterend', newRow);
    resizeTextarea(newRow.querySelector('textarea')); //セルの高さを文字数にあわせて調整
});

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
            ph.setHTML(_.t('INVALID_FILETYPE',locale));
        } else {
            ph.setHTML(_.t('DROP_AND_OPEN',locale));
        }
    }

}
//dragLeaveでエフェクトを解除
playerBox.ondragleave = document.ondrop = function (e) {
    playerBox.classList.remove("dragging");
    const ph = document.getElementById("placeholderInPlayer");
    if (ph != undefined) {
        ph.setHTML(window.api.t('DROP_HERE',locale));
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
    //console.log("skipForward");
    //Shiftキーが押されていたらn倍（GUIボタンで呼ばれた時のみ。キーボードの場合はkeyUpイベントで判定）
    if (isShiftKeyPressing) {
        skipForwardBig(event);
    } else {
        var sec = document.getElementById('Sel_ForwardSec').value;
        //Sel_ForwardSecの表示テキストを取得
        let text = document.getElementById('Sel_ForwardSec').options[document.getElementById('Sel_ForwardSec').selectedIndex].text;

        displayPlayerStatusForAWhile(text, "forward", 0.2);    //ステータス欄にジャンプ秒数を表示
        jumpToTimeIndex(parseFloat(player.currentTime) + parseFloat(sec)); //ジャンプ実行
    }
}
function skipBackward(event = null){
    //console.log("skipBackward");
    //Shiftキーが押されていたらn倍（GUIボタンで呼ばれた時のみ。キーボードの場合はkeyUpイベントで判定）
    if (isShiftKeyPressing) {
        skipBackwardBig(event);
    } else {
        var sec = document.getElementById('Sel_BackwardSec').value;
        //Sel_ForwardSecの表示テキストを取得
        let text = document.getElementById('Sel_ForwardSec').options[document.getElementById('Sel_ForwardSec').selectedIndex].text;

        displayPlayerStatusForAWhile(text, "backward", 0.2);    //ステータス欄にジャンプ秒数を表示
        jumpToTimeIndex(parseFloat(player.currentTime) - parseFloat(sec));
    }
}

//Shiftキー押しながらジャンプ
function skipForwardBig(event = null){
    //console.log("skipForwardBig");
    var sec = document.getElementById('Sel_ForwardSec').value;
    //Sel_ForwardSecの表示テキストを取得
    let text = document.getElementById('Sel_ForwardSec').options[document.getElementById('Sel_ForwardSec').selectedIndex].text + "x2";

    displayPlayerStatusForAWhile(text, "forward", 0.2);    //ステータス欄にジャンプ秒数を表示
    jumpToTimeIndex(parseFloat(player.currentTime) + parseFloat(sec　* multiPlyJumpIndex));
}
function skipBackwardBig(event = null){
    //console.log("skipBackwardBig");
    var sec = document.getElementById('Sel_BackwardSec').value;
    //Sel_ForwardSecの表示テキストを取得
    let text = document.getElementById('Sel_ForwardSec').options[document.getElementById('Sel_ForwardSec').selectedIndex].text + "x2";

    displayPlayerStatusForAWhile(text, "backward", 0.2);    //ステータス欄にジャンプ秒数を表示
    jumpToTimeIndex(parseFloat(player.currentTime) - parseFloat(sec　* multiPlyJumpIndex));
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

//キーボードショートカットで速度アップ
const playbackSpeedUp = ()=>  {
    if (player.paused == true) {
        player.play();
    } else {
        if (currentPlaybackRate < playbackRates.length -1) { currentPlaybackRate++; }
        //console.log(playbackRates[currentPlaybackRate] + "x");
        player.playbackRate = playbackRates[currentPlaybackRate];
    }
}
//キーボードショートカットで速度リセット
const playbackSpeedReset = ()=> {
        currentPlaybackRate = 3;
        player.playbackRate = 1.0;
        togglePlayPause();
}
//キーボードショートカットで速度ダウン
const playbackSpeedDown = ()=>  {
    if (player.paused != true) {
        if (currentPlaybackRate > 0) { currentPlaybackRate--; }                
        //console.log(playbackRates[currentPlaybackRate] + "x");
        player.playbackRate = playbackRates[currentPlaybackRate];
    } else {
        currentPlaybackRate = 2;
        player.playbackRate = playbackRates[currentPlaybackRate];
        player.play();
    }
}


//メインプロセス（メニュー）から
window.api.skipForward(()=>skipForward()); //スキップ実行
window.api.skipBackward(()=>skipBackward()); //スキップ実行
window.api.playbackSpeedUp(()=>playbackSpeedUp()); //スピードアップ
window.api.playbackSpeedDown(()=>playbackSpeedDown()); //スピードアップ
window.api.playbackSpeedReset(()=>playbackSpeedReset()); //スピードアップ
window.api.setSkipTime((direction, index)=>setSkipTime(direction, index)); //スキップ設定をselectに反映
//動画再生位置を指定秒に移動する
function jumpToTimeIndex(sec){
    //document.getElementById('body').focus();
    player.currentTime = sec;
    player.play();
    //doAutoLockOn('skip'); //メディアのseekedイベントから呼ぶので不要
}

// 未保存データがあることを示す「*」をタイトルに付加
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
    //桁数指定されたか、100分以上の時は分を3桁で返す
    if (minDigit == 3 || secTotal >= 6000) {
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
 * @param (textarea) textarea 対象のテキストエリア
 * @param (bool) isInitialize 初期化時の呼び出しかどうか（初期化時は最低限の処理のみ）
 */
function resizeTextarea(textarea, isInitialize = false) {
    //処理負荷軽減のために、必要な時だけ高さを変更する
    if (isInitialize == true) {
        //console.log("resizeTextarea - Initialize");
        if (textarea.scrollHeight > textarea.offsetHeight) {
            textarea.style.height = textarea.scrollHeight + "px";
        }
    } else {
        //console.log("resizeTextarea - Not initialize.");
        textarea.style.height = "0px"; //一瞬高さ0にすることでscrollHeightがリセットされる。これがないと増えた高さが戻らなくなる。
        textarea.style.height = textarea.scrollHeight + "px";
    }
}

function keyupTextarea(event) {
    //非同期でメインプロセスに問い合わせずに簡易OS判定
    var ua = window.navigator.userAgent;
    //Ctrl + Fが押されたらセルマージ処理（macOSでのみ必要。Windowsではメニューのアクセラレーター経由で実行されるのでここは抑止）
    if (ua.indexOf('Mac') !== -1 && event.key == "f" && event.ctrlKey == true) {
        const currentCellID = event.target.parentElement.parentElement.id;
        //console.log("MergeCell on " + currentCellID);        
        window.api.mergeCurrentAndNextCells(currentCellID);
    }

    //Escが押されたらフォーカスを外す
    if (event.key == 'Escape') {
        event.target.blur();
    }
}

/**
 * ウインドウがリサイズされた時にログ欄のセル高を調整する * 高さは自動で増えるが、↑を呼ばないと狭まらない
 * #dragBarのドラッグイベントからも呼んでいる。
 */
function resizeAllTextArea() {
    var rows = document.querySelectorAll('.script textarea');
    for (const ta of rows) {
        resizeTextarea(ta);
    }
}        

//連続したリサイズイベントをまとめて処理する
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        resizeAllTextArea();
    }, 200); // 200ミリ秒のデバウンス時間
});

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

//----------------------------------------------------
// #region レコードのマージ関連
//----------------------------------------------------

//メモリスト中のセルが選択された
function cellFocused(e) {
    //console.log("cell focused.");
    //メニューの「」を有効化する    
    window.api.enableOrDisableMenuItemMerge(true);
}

//メモリスト中のセル選択が解除された
function cellBlured(e) {
    //console.log("cell blured.");
    //メニューの「」を無効化する
    window.api.enableOrDisableMenuItemMerge(false);
}

//メインメニューからセル結合を実行
window.api.executeMergeCells(()=>{
    //対象セルのIDを調べる
    const recordId = document.activeElement.parentElement.parentElement.id;
    //console.log(recordId);
    window.api.mergeCurrentAndNextCells(recordId);
})


/* #endregion */

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
    //console.log("deleteRow:"+id);
    document.querySelector('#'+ id).remove();
})

//メインプロセスから指定ID行のメモを更新
window.api.updateRow((id, script)=>{
    const div = document.getElementById(id);
    const ta = div.querySelector('textarea');
    ta.value = script;
    //カーソルを最後の文字の後ろに移動
    ta.setSelectionRange(ta.value.length,ta.value.length);
    //テキストエリアの高さを更新
    resizeTextarea(ta);
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

let debounceTimeout;
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

        //全セルのリサイズ呼び出しにデバウンス処理を追加
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(function() {
            resizeAllTextArea(); //ログのセル高をリサイズする
        }, 200); // 200ミリ秒のデバウンス時間

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
        //console.log("not playing");
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
    //ステータスアイコンを表示
    displayPlayerStatusForAWhile("", "camera", 1);

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


//#region 黒フレーム検出関係（保留）

//再生中のフレームの左上の指定領域が真っ黒(blank)ならチャプターを挿入する
function AddChapeterForFrameBlank () {
    const canvas = document.createElement("canvas"); //判定用の縮小画像を載せるキャンバス
    //ソース映像を一定のサイズに縮小したものを解析
    const h = 12;
    const w = Math.floor(h * (player.videoWidth / player.videoHeight));
    canvas.height = h;
    canvas.width = w;
    //console.log("canvas size w:"+w+" h:"+h + " pixel num:"+h*w);
    //ビデオの元解像度からキャプチャサイズにスケールして保存
    canvas.getContext('2d').drawImage(player, 0, 0, player.videoWidth, player.videoHeight, 0, 0, w, h);
  
    //テスト保存
    //var dataURL = canvas.toDataURL("image/jpeg",0.8);
    //window.api.saveCapture(dataURL, secToMinSec(player.currentTime));
    
    const context = canvas.getContext('2d');
    const pixelBuffer = new Uint32Array(
         context.getImageData(0, 0, canvas.width, canvas.height).data.buffer
    );
    //console.log(pixelBuffer);
    //全てのピクセルが黒だったらチャプターを挿入する
    const luminanceThreshold = 10;
    if (!pixelBuffer.some(color => getLuminance(color) >= luminanceThreshold)){
        //連続でチャプター挿入をしない
        if (isPreviousFrameIsBlank == false) {
            //console.log(player.currentTime + " is blank.");
            //既に同じタイムコードのチャプターが存在しない場合、チャプターを挿入する
            if (isChapterAlreadyExistAt(player.currentTime)) {
                const inTime = player.currentTime;
                const script = "------";
                const speaker = 2;
                window.api.addNewMemoFromGUI(inTime, script, speaker);
            }
        }
        isPreviousFrameIsBlank = true;
    } else {
        //console.log(player.currentTime + " is not blank.");
        isPreviousFrameIsBlank = false;
    }
}

//int形式で渡されたRGBカラーコードの輝度値を返す
function getLuminance(intColor) {

    const hexColor = intColor.toString(16);
    //console.log(hexColor)
    let rgbArr = [];
    for(let i=0; i<hexColor.length;i+=2){
        rgbArr.push(parseInt(hexColor[i] + hexColor[i+1], 16));
    }
    //R: rgbArr[1];
    //G: rgbArr[2];
    //B: rgbArr[3];
    //輝度を求める
    // https://qiita.com/kozo002/items/97b3af1388ee4e04b876
    const luminance = Math.floor(0.298912 * rgbArr[1] + 0.586611 + rgbArr[2] + 0.114478 * rgbArr[3]);
    //console.log(`luminance:${luminance}`);
    return luminance;
}

/**
 * タイムコードが重複するチャプターが既に存在するか判定
 * メインプロセスがもっているrecordsを参照すると0.1秒精度の照会になるが、
 * 用途的に秒単位の方が都合が良く、同期処理もできるので、レンダラーの表示情報から検索する。
 * @param {タイムコード} currentTime 
 * @returns 存在すればtrue。なければfalse
 */
function isChapterAlreadyExistAt(currentTime) {
    const inTimesArray = Array.from(document.querySelectorAll('.inTime')); //.someを使う為NodeListを配列に変換
    return !inTimesArray.some(inTime => inTime.textContent === secToMinSec(currentTime));
}

//#endregion

//ログリストをクリア
window.api.clearRecords(()=>{
    memolist.textContent = "";
});

//自動スクロールのチェックボックス状態を設定に保存
function toglleAutoScroll(){
    const result = document.getElementById("Chk_AutoScroll").checked;
    window.api.setConfig("autoScroll", result);
}