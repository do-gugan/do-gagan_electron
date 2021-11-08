/**
 * TouchBar定義（macOS）
**/
"use strict";


const {TouchBar} = require ('electron');
const i18n = require('./i18n');
const config = require('./config');
const common = null;
let touchBar = null;
const slider = null;



class dggTouchbar {
    constructor(common) {
        this.common = common;
        const {TouchBarLabel, TouchBarButton, TouchBarSlider, TouchBarSpacer} = TouchBar;
        //TouchBar用部品を用意

        const _ = new i18n(config.get('lang'), 'menu');
        const TbBtn_JumpBackward = new TouchBarButton({
            label: '◀◀',
            accessibilityLabel: _.t('JUMP_R'),
            backgroundColor: '#444',
            click: (event) => this.common.skipBackwardToPlayer(event),
        });
        const TbBtn_JumpForwardward = new TouchBarButton({
            label: '▶▶',
            accessibilityLabel: _.t('JUMP_F'),
            backgroundColor: '#444',
            click: (event) => this.common.skipForwardToPlayer(event),
        });
        const TbBtn_PlayPasue = new TouchBarButton({
            label: '▶/II',
            accessibilityLabel: _.t('PLAY-PAUSE'),
            backgroundColor: '#444',
            click: (event) => this.common.playPauseToPlayer(event),
        });
        const TBSlider_ChangePosition = new TouchBarSlider({
            accessibilityLabel: _.t('PLAYBACK_SLIDER'),
            backgroundColor: '#444',
            minValue: 0,
            maxValue: 100,
            value: 0,
            change: (event) => this.common.changePositionFromSlider(event)
        });
        this.slider = TBSlider_ChangePosition;
        
        this.touchBar = new TouchBar({
            items: [
                TbBtn_JumpBackward,
                TbBtn_PlayPasue,
                TbBtn_JumpForwardward,
                TBSlider_ChangePosition,
            ]
        });
    }

    //クラスの中のtouchBar定義を返す
    getTouchBar () {
        return this.touchBar;
    }

    setCommon(cmn) {
        this.common = cmn;
    }
    /**
     * ノブ位置を再生位置に同期
     * @param {Number} pos(0-100) 
     */
    updateKnobPosition(pos) { 
        this.slider.value = Math.floor(pos);
    }
}

module.exports =  new dggTouchbar();
