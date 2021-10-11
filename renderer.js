       //グローバルオブジェクト
       let locale;
       let _; //ローカライズ文字列取得用
       let player; //videoタグ
       let playerBox = document.getElementById("player-box");


       // メインプロセスから言語環境を取得し、ページに必要なテキストを表示
       //const i18n = window.requires.i18n;
       (async ()=>{
           //const locale = await window.requires.ipcRenderer.invoke('getConfig', 'locale');
           locale = await window.api.getConfig('locale');
           //const locale = 'en';
           _ = window.api;
           document.getElementById("Lbl_Search").innerHTML = _.t('SEARCH',locale) + ":";
           document.getElementById("Btn_SearchClear").textContent = _.t('CLEAR',locale);
           playerBox.innerHTML = '<div id="placeholderWrapper"><div id="placeholderInPlayer">' + _.t('DROP_HERE',locale) + '</div></div>';
           document.getElementById("Lbl_ShowHideNewMemo").innerHTML = _.t('NEW_MEMO_FIELD',locale);
           document.getElementById("Sel_BackwardSec").innerHTML = updateJumpSecOptions();
           document.getElementById("Sel_ForwardSec").innerHTML = updateJumpSecOptions();

           //初期ウインドウタイトル（バージョン表示）
           document.title = _.t('APPNAME') + "3 Ver." + window.api.getAppVersion();
       })();

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

       }
       /* #region プレーヤーのイベントハンドラー（状態変化検知）系 */
       function playerPlayed() {

       }

       function playerPaused() {

       }


       /* #endregion */

       async function changeWindowTitle(path) {
           const filename = path.substring(path.lastIndexOf('\\') + 1); //macOSだとどうなる？
           document.title = _.t("APPNAME",locale) + "3 | " + filename;
       }
       
       /**
        * 新規メモ欄の表示／非表示を切り替え
       */
       const toglleNewMemoBlock = function () {
           const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
           const bottom = document.querySelector("#bottom");

           if (checkbox.checked == true) {
               bottom.style.display = 'block';
               window.api.toggleNewMemoBlockMenu(true);
           } else {
               bottom.style.display = 'none';
               window.api.toggleNewMemoBlockMenu(false);
           }
       }

       /**
        * メインプロセスからのプッシュで新規メモ欄の表示／非表示を切り替え、結果をboolで返す
       */
       window.api.toggleNewMemoBlockFromMenu((event, result)=>{
           const checkbox = document.querySelector("#Chk_ShowHideNewMemo");
           const bottom = document.querySelector("#bottom");

           if (bottom.style.display == 'none') {
               //非表示だったら表示
               bottom.style.display = 'block';
               checkbox.checked = true;
               return true;
           } else {
               //表示だったら非表示
               bottom.style.display = 'none';
               checkbox.checked = false;
               return false;
           }


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
               //const locale = window.api.getConfig('locale'); //非同期でとれない
               //対応形式
               const validTypes = [
                   'video/mp4',
                   'video/webm',
                   'video/ogg', //ogv
                   'audio/mpeg', //mp3
                   'audio/wav',
                   'audio/ogg'
                   ];           
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
           //console.log('file dropped:', e.dataTransfer.files[0].path);
           window.api.openDroppedFile(e.dataTransfer.files[0].path);
       });

       /* #region 再生制御系ボタン */
       //再生・一時停止
       document.getElementById('Btn_PlayPause').addEventListener('click', function() {
           togglePlayPause();
       });
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
        //動画再生位置を指定秒に移動する
        function jumpToTimeIndex(sec){
            //document.getElementById('body').focus();
            player.currentTime = sec;
            player.play();
        }

        //秒インデックスを「分：秒」形式に変換
        function secToMinSec(secTotal){
            min = Math.floor(secTotal / 60);
            sec = secTotal - min*60;
            return ( '00' + min ).slice( -2 ) + ":" + ( '00' + sec ).slice( -2 )
        }

       /* endregion */