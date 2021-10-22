const { app, Menu } = require('electron');
const common = require('./common');
const i18n = require('./i18n')
const dialog = require('./dialog');

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
          {role:'about', label: _.t('ABOUT') },
          {type:'separator'},
          {role:'services', label: _.t('SERVICE')},
          {type:'separator'},
          {role:'hide', label: _.t('HIDE')},
          {role:'hideothers', label: _.t('HIDEOTHERS')},
          {role:'unhide', label: _.t('UNHIDE')},
          {type:'separator'},
          {role:'quit', label: _.t('QUIT-MAC'), accelerator: ''}
        ]
      }] : []),
      {
            label: _.t('FILE'),
            submenu: [
                {label: _.t('OPEN-MOVIE'), click: ()=>{
                    //console.log('OPEN-MOVIE');
                    dialog.openVideoDialog();
                }},
                {type: 'separator'},
                {id:'ADD-LOG', label: _.t('ADD-LOG'), enabled: false, click: ()=>{
                    //console.log('ADD-LOG');
                    dialog.openLog();
                }},
                {type: 'separator'},
                {id:'OVERWRITE', label: _.t('OVERWRITE'), enabled: false,accelerator: 'CmdOrCtrl+S',  click: ()=>{
                    console.log('OVERWRITE');
                }},
                {id:'AUTOSAVE', label: _.t('AUTOSAVE'), type: 'checkbox', click: ()=>{
                    console.log('AUTOSAVE');
                }},
                {id:'SAVE-AS', label: _.t('SAVE-AS'), enabled: false, click: ()=>{
                    console.log('SAVE-AS');
                }},
                {id:'EXPORT-LITE', label: _.t('EXPORT-LITE'), enabled: false, click: ()=>{
                    console.log('EXPORT-LITE');
                }},
                {type: 'separator'},
                {id:'SETTINGS', label: _.t('SETTINGS'), click: ()=>{
                    console.log('SETTINGS...');
                }},
                ...(isMac ? [] : [{id:'QUIT', label: _.t('QUIT'), role: 'quit'}]),
            ]
        },
        {
            label: _.t('EDIT'),
            submenu: [
                {id:'', label: _.t('CUT'), enabled: false, role: 'cut'},
                {id:'', label: _.t('COPY'), enabled: false, role: 'copy'},
                {id:'', label: _.t('PASTE'), enabled: false, role: 'paste'},
                {type: 'separator'},
                {id:'', label: _.t('REPLACE'), enabled: false, click: ()=>{
                    console.log('REPLACE');
                }}
            ]
        },

        {
            label: _.t('PLAYBACK-CONTROL'),
            submenu: [
                {id:'PLAY-PAUSE', label: _.t('PLAY-PAUSE'), enabled: false, accelerator: 'CmdOrCtrl+Space', click: ()=>{
                    //console.log('PLAY-PAUSE');
                    common.playPauseToPlayer();
                }},
                {id:'JUMP_F', label: _.t('JUMP_F'), enabled: false, accelerator: 'CmdOrCtrl+W', click: ()=>{
                    //console.log('JUMP_F');
                    common.skipForwardToPlayer();
                }},
                {id:'JUMP_R', label: _.t('JUMP_R'), enabled: false, accelerator: 'CmdOrCtrl+Q', click: ()=>{
                    //console.log('JUMP_R');
                    common.skipBackwardToPlayer();
                }},
                {type: 'separator'},
                {id:'JUMP_F_SEC', label: _.t('JUMP_F_SEC'),
                submenu: [
                    {id:'FSEC_3', label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        console.log('SEC_3');
                    }},
                    {id:'FSEC_5', label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        console.log('SEC_5');
                    }},
                    {id:'FSEC_10', label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        console.log('SEC_10');
                    }},
                    {id:'FSEC_15', label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        console.log('SEC_15');
                    }},
                    {id:'FSEC_30', label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        console.log('SEC_30');
                    }},
                    {id:'FSEC_60', label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        console.log('SEC_60');
                    }},
                    {id:'FSEC_90', label: _.t('SEC_90'), type: 'checkbox', click: ()=>{
                        console.log('SEC_90');
                    }},
                    {id:'FSEC_120', label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        console.log('SEC_120');
                    }},
                    {id:'FSEC_180', label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        console.log('SEC_180');
                    }},
                    {id:'FSEC_300', label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        console.log('SEC_300');
                    }},
                    {id:'FSEC_600', label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        console.log('SEC_600');
                    }}
                ]
                },
                {id:'', label: _.t('JUMP_R_SEC'),
                submenu: [
                    {id:'RSEC_3', label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        console.log('SEC_3');
                    }},
                    {id:'RSEC_5', label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        console.log('SEC_5');
                    }},
                    {id:'RSEC_10', label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        console.log('SEC_10');
                    }},
                    {id:'RSEC_15', label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        console.log('SEC_15');
                    }},
                    {id:'RSEC_30', label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        console.log('SEC_30');
                    }},
                    {id:'RSEC_60', label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        console.log('SEC_60');
                    }},
                    {id:'RSEC_90', label: _.t('SEC_90'), type: 'checkbox', click: ()=>{
                        console.log('SEC_90');
                    }},
                    {id:'RSEC_120', label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        console.log('SEC_120');
                    }},
                    {id:'RSEC_180', label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        console.log('SEC_180');
                    }},
                    {id:'RSEC_300', label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        console.log('SEC_300');
                    }},
                    {id:'RSEC_600', label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        console.log('SEC_600');
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
                {label: _.t('GOTO-SUPPORT-PAGE'), click: ()=>{
                    console.log('GOTO-SUPPORT-PAGE');
                    common.openSupportSite();
                }},
                {label: _.t('VERSION-INFO'), click: ()=>{
                    console.log('VERSION-INFO');
                    dialog.openAboutDialog();
                }}
            ]
        }
    
    ]);


  Menu.setApplicationMenu(template);
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
    common.toggleNewMemoBlockFromMenu(!mItem.checked);
}

/**
 * メディア読み込み時にメニューを有効化する
 */
const enableMenuWhenMediaOpened = function () {
    Menu.getApplicationMenu().getMenuItemById('ADD-LOG').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('OVERWRITE').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('SAVE-AS').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('EXPORT-LITE').enabled = true;

    Menu.getApplicationMenu().getMenuItemById('PLAY-PAUSE').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('JUMP_F').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('JUMP_R').enabled = true;
    Menu.getApplicationMenu().getMenuItemById('PLAY-PAUSE').enabled = true;
}


//--------------------------------
// exports
//--------------------------------
module.exports = {
    setTemplate: setTemplate,
    toggleNewMemoBlockMenu : toggleNewMemoBlockMenu,
    enableMenuWhenMediaOpened : enableMenuWhenMediaOpened,
}
