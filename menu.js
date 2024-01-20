const { app, Menu } = require('electron');
const common = require('./common');
const i18n = require('./i18n')
const dialog = require('./dialog');
const config = require('./config');
const path = require('path');

// 実行環境がmacOSならtrue
const isMac = (process.platform === 'darwin');  // 'darwin' === macOS

/**
 * メニュー用テンプレートを返却
 *
 * @param {string} lang 言語コード
 * @return {object} Menu
 */
const setTemplate = (lang='ja') => {
  const _ = new i18n(lang, 'menu');
  const template = Menu.buildFromTemplate([
    ...(isMac ? [{
        label: app.name,
        submenu: [
          /* {role:'about', label: _.t('ABOUT') }, */
          {label: _.t('ABOUT'), click: ()=>{
                common.showAbout();
          }},
          {type:'separator'},
          {role:'services', label: _.t('SERVICE')},
          {type:'separator'},
          {role:'hide', label: _.t('HIDE')},
          {role:'hideothers', label: _.t('HIDEOTHERS')},
          {role:'unhide', label: _.t('UNHIDE')},
          {type:'separator'},
          {role:'quit', label: _.t('QUIT-MAC'), accelerator: 'Command+q'}
        ]
      }] : []),
      {
            label: _.t('FILE'),
            submenu: [
                {label: _.t('OPEN-MOVIE'), accelerator: 'CmdOrCtrl+O', click: ()=>{
                    //console.log('OPEN-MOVIE');
                    dialog.openVideoDialog();
                }},
                {label: _.t('CLOSE-WINDOW'), accelerator: 'CmdOrCtrl+W', click: ()=>{
                    //console.log('CLOSE-WINDOW');
                    common.closeWindow();
                }},
                {type: 'separator'},
                {id:'ADD-LOG', label: _.t('ADD-LOG'), enabled: false, click: ()=>{
                    //console.log('ADD-LOG');
                    dialog.openLog();
                }},
                {type: 'separator'},
                {id:'OVERWRITE', label: _.t('OVERWRITE'), enabled: false,accelerator: 'CmdOrCtrl+S',  click: ()=>{
                    //console.log('OVERWRITE');
                    common.saveLog('', '2.0', false);
                }},
                {id:'AUTOSAVE', label: _.t('AUTOSAVE'), type: 'checkbox', click: (menuItem)=>{
                    common.toggleAutoSave(menuItem.checked, true);
                }},
                {id:'SAVE-AS', label: _.t('SAVE-AS'), enabled: false, click: ()=>{
                    //console.log('SAVE-AS');
                    dialog.saveLogAs();
                }},
                {id:'EXPORT-LITE', label: _.t('EXPORT-LITE'), enabled: false, click: ()=>{
                    //console.log('EXPORT-LITE');
                    common.exportLite();
                }},
                {type: 'separator'},
                {id:'SETTINGS', label: _.t('SETTINGS'), click: ()=>{
                    common.openSettingsWindow();
                }},
                ...(isMac ? [] : [{id:'QUIT', label: _.t('QUIT'), role: 'quit'}]),
            ]
        },
        {
            label: _.t('EDIT'),
            submenu: [
                {id:'CUT', label: _.t('CUT'), enabled: false, role: 'cut'},
                {id:'COPY', label: _.t('COPY'), enabled: false, role: 'copy'},
                {id:'PASTE', label: _.t('PASTE'), enabled: false, role: 'paste'},
                {type: 'separator'},
                {id:'REPLACE', label: _.t('REPLACE'), enabled: false, click: ()=>{
                    common.openReplaceWindow();
                }},
                {id:'MERGE', label: _.t('MERGE'), enabled: false,accelerator: 'Control+F', click: ()=>{
                    //ここからは呼ばず、レンダラーのtextareaのkeyUpイベントから処理
                }}
            ]
        },

        {
            label: _.t('PLAYBACK-CONTROL'),
            submenu: [
                {id:'PLAY-PAUSE', label: _.t('PLAY-PAUSE'), enabled: false, accelerator: 'Control+E', click: ()=>{
                    //console.log('PLAY-PAUSE');
                    common.playPauseToPlayer();
                }},
                {id:'JUMP_F', label: _.t('JUMP_F'), enabled: false, accelerator: 'Control+W', click: (event)=>{
                    //console.log('JUMP_F');
                    common.skipForwardToPlayer(event);
                }},
                {id:'JUMP_R', label: _.t('JUMP_R'), enabled: false, accelerator: 'Control+Q', click: (event)=>{
                    //console.log('JUMP_R');
                    common.skipBackwardToPlayer(event);
                }},
                {id:'SPEED_UP', label: _.t('SPEED_UP'), enabled: false, accelerator: 'Control+D', click: (event)=>{
                    //console.log('SPEED_UP');
                    common.playbackSpeedUp(event);
                }},
                {id:'SPEED_RESET', label: _.t('SPEED_RESET'), enabled: false, accelerator: 'Control+S', click: (event)=>{
                    //console.log('SPEED_RESET');
                    common.playbackSpeedReset(event);
                }},
                {id:'SPEED_DOWN', label: _.t('SPEED_DOWN'), enabled: false, accelerator: 'Control+A', click: (event)=>{
                    //console.log('SPEED_DOWN');
                    common.playbackSpeedDown(event);
                }},
                {type: 'separator'},
                {id:'JUMP_F_SEC', label: _.t('JUMP_F_SEC'),
                submenu: [
                    {id:'FSEC_0', label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',0);
                    }},
                    {id:'FSEC_1', label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',1);
                    }},
                    {id:'FSEC_2', label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',2);
                    }},
                    {id:'FSEC_3', label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',3);
                    }},
                    {id:'FSEC_4', label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',4);
                    }},
                    {id:'FSEC_5', label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',5);
                    }},
                    {id:'FSEC_6', label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',6);
                    }},
                    {id:'FSEC_7', label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',7);
                    }},
                    {id:'FSEC_8', label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',8);
                    }},
                    {id:'FSEC_9', label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('forward',9);
                    }}
                ]
                },
                {id:'', label: _.t('JUMP_R_SEC'),
                submenu: [
                    {id:'RSEC_0', label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',0);
                    }},
                    {id:'RSEC_1', label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',1);
                    }},
                    {id:'RSEC_2', label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',2);
                    }},
                    {id:'RSEC_3', label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',3);
                    }},
                    {id:'RSEC_4', label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',4);
                    }},
                    {id:'RSEC_5', label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',5);
                    }},
                    {id:'RSEC_6', label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',6);
                    }},
                    {id:'RSEC_7', label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',7);
                    }},
                    {id:'RSEC_8', label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',8);
                    }},
                    {id:'RSEC_9', label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        common.setSkipTime('backward',9);
                    }}
                ]},
            ]
        },
        {
            label: _.t('VIEW'),
            submenu: [
                {id:'MN_SHOW_NEW_MEMO_BLOCK', label: _.t('NEW-MEMO'), type: 'checkbox', checked: true, accelerator: 'CmdOrCtrl+M', click: ()=>{
                    //console.log('NEW-MEMO');
                    toggleNewMemoBlockFromMenu();
                }}
            ]
        },
        {
            label: _.t('HELP'),
            submenu: [
                {label: _.t('GOTO-MARKER-PAGE'), click: ()=>{
                    //console.log('GOTO-MARKER-PAGE');
                    common.openMarkerPage();
                }},
                {label: _.t('GOTO-SUPPORT-PAGE'), click: ()=>{
                    //console.log('GOTO-SUPPORT-PAGE');
                    common.openSupportSite();
                }},
                {label: _.t('VERSION-INFO'), click: ()=>{
                    common.showAbout();
                }}
            ]
        }
    
    ]);

  
  Menu.setApplicationMenu(template);

  //自動保存のチェック状態を設定から復帰
  const autoSaveSwitch = config.get('autoSaveSwitch');
  Menu.getApplicationMenu().getMenuItemById('AUTOSAVE').checked = autoSaveSwitch;
  common.toggleAutoSave(autoSaveSwitch);
}

/**
 * 「表示」メニューの「新規メモ欄」のチェックをON/OFF（レンダラーからの操作）
 * 
 * @param {boolean} result
 */
const toggleNewMemoBlockMenu = function (result) {
    const mItem = Menu.getApplicationMenu().getMenuItemById('MN_SHOW_NEW_MEMO_BLOCK');
    mItem.checked = result;
}

/**
 * 「表示」メニューの「新規メモ欄」が選択されたら自身のチェック状態をレンダラーに伝え反映させる
 */
const toggleNewMemoBlockFromMenu = function () {
    const mItem = Menu.getApplicationMenu().getMenuItemById('MN_SHOW_NEW_MEMO_BLOCK');
    common.toggleNewMemoBlockFromMenu(mItem.checked);
    //設定保存
    config.set('newMemoBlockShown', mItem.checked);
}

/**
 * メディア読み込み時にメニューを有効化する
 */
const enableMenuWhenMediaOpened = function () {
    Menu.getApplicationMenu().getMenuItemById('ADD-LOG').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('OVERWRITE').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('SAVE-AS').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('EXPORT-LITE').enabled = true;

    Menu.getApplicationMenu().getMenuItemById('CUT').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('COPY').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('PASTE').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('REPLACE').enabled = true;

    Menu.getApplicationMenu().getMenuItemById('PLAY-PAUSE').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('JUMP_F').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('JUMP_R').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('SPEED_UP').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('SPEED_RESET').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('SPEED_DOWN').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('PLAY-PAUSE').enabled = true;
}

/**
 * GUIで変更されたスキップ秒数をメニューにも反映
 * @param {string} direction 
 * @param {Number} sec 
 */
const setSkipTimeFromGUI = function(direction, idx) {
    let direcKey = '';
    switch (direction) {
        case 'forward':
            direcKey = 'FSEC_';
            break;
        case 'backward':
            direcKey = 'RSEC_';
            break;    
    }
    //全てOFF
    for (let i; i<10; i++){
        secs.forEach(s => Menu.getApplicationMenu().getMenuItemById(direcKey + i).checked = false);
    }
    //該当項目にチェック
    Menu.getApplicationMenu().getMenuItemById(direcKey+idx).checked = true;
}

/**
 * メニューの「次のメモと統合」の有効化と無効化（いずれかのメモがフォーカスされると有効化）
 * @param {boolean} bool 
 */
const enableOrDisableMenuItemMerge = function(bool) {
    if (typeof bool === "boolean") {
        Menu.getApplicationMenu().getMenuItemById('MERGE').enabled = bool;
    } else {
        console.log("[toggleMarge] The argument passed is not bool type. :" + bool);
    }
}

//--------------------------------
// exports
//--------------------------------
module.exports = {
    setTemplate: setTemplate,
    toggleNewMemoBlockMenu : toggleNewMemoBlockMenu,
    enableMenuWhenMediaOpened : enableMenuWhenMediaOpened,
    setSkipTimeFromGUI: setSkipTimeFromGUI,
    enableOrDisableMenuItemMerge: enableOrDisableMenuItemMerge
}
