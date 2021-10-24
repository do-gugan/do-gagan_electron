/**
 * チャプター1つを示すオブジェクト
 * @constructor
 */
 "use strict";

/**
 * メモ欄のレコードクラス
 */
class dggRecord {
    static maxId = 0; //ユニークIDを発番するための最大値を保持

    /**
     * 
     * @param {Number} inTime IN点
     * @param {string} script メモ内容
     * @param {Number} speaker 話者コード（0-7）
     * @param {Number} confidence 書き起こし信頼度(0.0-1.0)
     */
    constructor(inTime, script, speaker=0, confidence=1.0) {
        /**
         * ユニークID
         * @type {Number}
         */
            this.id = "row" + dggRecord.maxId++; //発番する度に+1
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