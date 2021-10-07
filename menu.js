const { app, Menu } = require('electron');
const i18n = require('./i18n')
const dialog = require('./dialog')

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
          {role:'about',      label: _.t('ABOUT') },
          {type:'separator'},
          {role:'services',   label: _.t('SERVICE')},
          {type:'separator'},
          {role:'hide',       label: _.t('HIDE')},
          {role:'hideothers', label: _.t('HIDEOTHERS')},
          {role:'unhide',     label: _.t('UNHIDE')},
          {type:'separator'},
          {role:'quit',       label: _.t('QUIT-MAC')}
        ]
      }] : []),
      {
            label: _.t('FILE'),
            submenu: [
                {label: _.t('OPEN-MOVIE'), click: ()=>{
                    console.log('動画/音声ファイルを開く');
                }},
                {type: 'separator'},
                {label: _.t('ADD-LOG'), click: ()=>{
                    console.log('ログを追加する');
                }},
                {type: 'separator'},
                {label: _.t('OVERWRITE'), click: ()=>{
                    console.log('上書き保存');
                }},
                {label: _.t('AUTOSAVE'), click: ()=>{
                    console.log('自動上書き');
                }},
                {label: _.t('SAVE-AS'), click: ()=>{
                    console.log('名前を付けて書き出し');
                }},
                {label: _.t('EXPORT-LITE'), click: ()=>{
                    console.log('動画眼Lite形式で書き出し');
                }},
                {type: 'separator'},
                {label: _.t('SETTINGS'), click: ()=>{
                    console.log('設定...');
                }},
                {label: _.t('QUIT'), role: 'quit'}
            ]
        },
        {
            label: _.t('EDIT'),
            submenu: [
                {label: _.t('CUT'), role: 'cut'},
                {label: _.t('COPY'), role: 'copy'},
                {label: _.t('PASTE'), role: 'paste'},
                {type: 'separator'},
                {label: _.t('REPLACE'), click: ()=>{
                    console.log('置換');
                }}
            ]
        },

        {
            label: _.t('PLAYBACK-CONTROL'),
            submenu: [
                {label: _.t('PLAY-PAUSE'), click: ()=>{
                    console.log('置換');
                }},
                {label: _.t('JUMP_F'), click: ()=>{
                    console.log('JUMP_F');
                }},
                {label: _.t('JUMP_R'), click: ()=>{
                    console.log('JUMP_R');
                }},
                {type: 'separator'},
                {label: _.t('JUMP_F_SEC'), enabled: false,
                submenu: [
                    {label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        console.log('SEC_3');
                    }},
                    {label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        console.log('SEC_5');
                    }},
                    {label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        console.log('SEC_10');
                    }},
                    {label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        console.log('SEC_15');
                    }},
                    {label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        console.log('SEC_30');
                    }},
                    {label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        console.log('SEC_60');
                    }},
                    {label: _.t('SEC_90'), type: 'checkbox', click: ()=>{
                        console.log('SEC_90');
                    }},
                    {label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        console.log('SEC_120');
                    }},
                    {label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        console.log('SEC_180');
                    }},
                    {label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        console.log('SEC_300');
                    }},
                    {label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        console.log('SEC_600');
                    }}
                ]
                },
                {label: _.t('JUMP_R_SEC'), enabled: false,
                submenu: [
                    {label: _.t('SEC_3'), type: 'checkbox', click: ()=>{
                        console.log('SEC_3');
                    }},
                    {label: _.t('SEC_5'), type: 'checkbox', click: ()=>{
                        console.log('SEC_5');
                    }},
                    {label: _.t('SEC_10'), type: 'checkbox', click: ()=>{
                        console.log('SEC_10');
                    }},
                    {label: _.t('SEC_15'), type: 'checkbox', click: ()=>{
                        console.log('SEC_15');
                    }},
                    {label: _.t('SEC_30'), type: 'checkbox', click: ()=>{
                        console.log('SEC_30');
                    }},
                    {label: _.t('SEC_60'), type: 'checkbox', click: ()=>{
                        console.log('SEC_60');
                    }},
                    {label: _.t('SEC_90'), type: 'checkbox', click: ()=>{
                        console.log('SEC_90');
                    }},
                    {label: _.t('SEC_120'), type: 'checkbox', click: ()=>{
                        console.log('SEC_120');
                    }},
                    {label: _.t('SEC_180'), type: 'checkbox', click: ()=>{
                        console.log('SEC_180');
                    }},
                    {label: _.t('SEC_300'), type: 'checkbox', click: ()=>{
                        console.log('SEC_300');
                    }},
                    {label: _.t('SEC_600'), type: 'checkbox', click: ()=>{
                        console.log('SEC_600');
                    }}
                ]},
            ]
        },
        {
            label: _.t('VIEW'),
            submenu: [
                {label: _.t('NEW-MEMO'), click: ()=>{
                    console.log('NEW-MEMO');
                }}
            ]
        },
        {
            label: _.t('HELP'),
            submenu: [
                {label: _.t('GOTO-SUPPORT-PAGE'), click: ()=>{
                    console.log('GOTO-SUPPORT-PAGE');
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

//--------------------------------
// exports
//--------------------------------
module.exports = {
    setTemplate: setTemplate
}
