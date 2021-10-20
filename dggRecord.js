/**
 * チャプター1つを示すオブジェクト
 * @constructor
 */
 "use strict";

/**
 * メモ欄のレコードクラス
 */
class dggRecord {
    constructor(id, inTime, script, speaker=0, confidence=1.0) {
        /**
         * ユニークID
         * @type {Number}
         */
            this.id = id;
            /**
         * タイムスタンプ
         * @type {Number}
         */
        this.inTime = inTime;
        /**
         * テキスト
         * @type {String}
         */
        this.script = script;
        /**
         * 話者フラグ（1～10）
         * @type {Number}
         */
        this.speaker = speaker;
        /**
         * //書き起こし確信度（0.0～1.0）（現状不使用）
         * @type {Number}
         */
        this.confidence = confidence;             
    }

}
module.exports = dggRecord;