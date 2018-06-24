'use strict';
//Global define
var Diamond = new BigNumber(20);
var Gold = new BigNumber(10);
var Silver = new BigNumber(3);
var Brozen = new  BigNumber(1);
var blockLimit = new BigNumber(10);

var Allowed = function (obj) {
    this.allowed = {};
    this.parse(obj);
};

Allowed.prototype = {
    toString: function () {
        return JSON.stringify(this.allowed);
    },

    parse: function (obj) {
        if (typeof obj != "undefined") {
            var data = JSON.parse(obj);
            for (var key in data) {
                this.allowed[key] = new BigNumber(data[key]);
            }
        }
    },

    get: function (key) {
        return this.allowed[key];
    },

    set: function (key, value) {
        this.allowed[key] = new BigNumber(value);
    }
};

var ChallengeContent = function(text) {
    if (text) {
         var o = JSON.parse(text);
         this.challengeLevel = new BigNumber(o.challengeLevel);
         this.challenge = o.challenge.toString();
         this.timeEstimation = o.timeEstimation.tostring();
         this.author = o.author.toString();
         this.timeStamp = o.timeStamp.toString();
         this.blockHeight = new BigNumber(o.blockHeight);
         this.answer = new Array();
    }
};

ChallengeContent.prototype = function(){
    // body...
};

var answerContent = function(text) {
    if (text) {
        var o = JSON.parse(text);
        this.answerId = new BigNumber(o.answerId);
        this.answer = o.answer.toString();
        this.answered = o.answered.toString();
        this.timeStamp = o.timeStamp.toString();
        this.blockHeight = new BigNumber(o.blockHeight);
        this.like = new Array();
        this.dislike = new Array();
    }
    else {

    }
};

answerContent.prototype = function(){
    // body...
};

// var chooseContent = function (text) {
//     if (text){
//         var o = JSON.parse(text);
//         this.amount = new BigNumber(o.amount);
//         this.chooser = o.chooser.toString();
//     }
// };
//
// chooseContent.prototype=function(){
//
// };

var challengeContract = function () {
    LocalContractStorage.defineProperties(this, {
        _name: null,
        _symbol: null,
        _decimals: null,
        _admin: "n1WJaKuQ8vQ8AzoGBZfYH3GLGzULQ2WwJvp",
        _totalSupply: {
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        }
    });

    LocalContractStorage.defineMapProperties(this, {
        "balances": {
            parse: function (value) {
                return new BigNumber(value);
            },
            stringify: function (o) {
                return o.toString(10);
            }
        },
        "allowed": {
            parse: function (value) {
                return new Allowed(value);
            },
            stringify: function (o) {
                return o.toString();
            }
        },
        "ChallengeValut": {
            parse: function(text) {
                return new ChallengeContent(text);
            },
            stringify: function(o){
                return o.toString();
            }
        }
    });
};

challengeContract.prototype = {

 init: function (name, symbol, decimals, totalSupply) {
        this._name = name;
        this._symbol = symbol;
        this._decimals = decimals || 0;
        this._totalSupply = new BigNumber(totalSupply).mul(new BigNumber(10).pow(decimals));

        var from = Blockchain.transaction.from;
        this.balances.set(from, this._totalSupply);
        this.transferEvent(true, from, from, this._totalSupply);
    },

    // Returns the name of the token
    name: function () {
        return this._name;
    },

    // Returns the symbol of the token
    symbol: function () {
        return this._symbol;
    },

    // Returns the number of decimals the token uses
    decimals: function () {
        return this._decimals;
    },

    totalSupply: function () {
        return this._totalSupply.toString(10);
    },

    balanceOf: function (owner) {
        var balance = this.balances.get(owner);

        if (balance instanceof BigNumber) {
            return balance.toString(10);
        } else {
            return "0";
        }
    },

    transfer: function (to, value) {
        value = new BigNumber(value);
        if (value.lt(0)) {
            throw new Error("invalid value.");
        }

        var from = Blockchain.transaction.from;
        var balance = this.balances.get(from) || new BigNumber(0);

        if (balance.lt(value)) {
            throw new Error("transfer failed.");
        }

        this.balances.set(from, balance.sub(value));
        var toBalance = this.balances.get(to) || new BigNumber(0);
        this.balances.set(to, toBalance.add(value));

        this.transferEvent(true, from, to, value);
    },

    transferFrom: function (from, to, value) {
        var spender = Blockchain.transaction.from;
        var balance = this.balances.get(from) || new BigNumber(0);

        var allowed = this.allowed.get(from) || new Allowed();
        var allowedValue = allowed.get(spender) || new BigNumber(0);
        value = new BigNumber(value);

        if (value.gte(0) && balance.gte(value) && allowedValue.gte(value)) {

            this.balances.set(from, balance.sub(value));

            // update allowed value
            allowed.set(spender, allowedValue.sub(value));
            this.allowed.set(from, allowed);

            var toBalance = this.balances.get(to) || new BigNumber(0);
            this.balances.set(to, toBalance.add(value));

            this.transferEvent(true, from, to, value);
        } else {
            throw new Error("transfer failed.");
        }
    },

    transferEvent: function (status, from, to, value) {
        Event.Trigger(this.name(), {
            Status: status,
            Transfer: {
                from: from,
                to: to,
                value: value
            }
        });
    },

    approve: function (spender, currentValue, value) {
        var from = Blockchain.transaction.from;

        var oldValue = this.allowance(from, spender);
        if (oldValue != currentValue.toString()) {
            throw new Error("current approve value mistake.");
        }

        var balance = new BigNumber(this.balanceOf(from));
        var value = new BigNumber(value);

        if (value.lt(0) || balance.lt(value)) {
            throw new Error("invalid value.");
        }

        var owned = this.allowed.get(from) || new Allowed();
        owned.set(spender, value);

        this.allowed.set(from, owned);

        this.approveEvent(true, from, spender, value);
    },

    approveEvent: function (status, from, spender, value) {
        Event.Trigger(this.name(), {
            Status: status,
            Approve: {
                owner: from,
                spender: spender,
                value: value
            }
        });
    },

    allowance: function (owner, spender) {
        var owned = this.allowed.get(owner);

        if (owned instanceof Allowed) {
            var spender = owned.get(spender);
            if (typeof spender != "undefined") {
                return spender.toString(10);
            }
        }
        return "0";
    },

    PostChallenge: function(challengeId, challengeLevel, challenge, timeEstimation){

        var from = Blockchain.transaction.from;

        var challengeItem = new ChallengeContent();

        challengeItem.challengeLevel = challengeLevel;
        challengeItem.challenge = challenge;
        challengeItem.timeEstimation = timeEstimation;
        challengeItem.author = from;
        challengeItem.timeStamp = new Date();
        challengeItem.blockHeight = Blockchain.block.height;

        this.ChallengeValut.put(challengeId,challengeItem);
    },

    AnswerChallenge: function(challengeId, answerId, answer){

        var from = Blockchain.transaction.from;

        var challengeItem = this.ChallengeValut.get(challengeId);

        var answerItem = new answerContent();

        answerItem.answerId = answerId;
        answerItem.answer = answer;
        answerItem.answered = from;
        answerItem.timeStamp = new Date();
        answerItem.blockHeight = Blockchain.block.blockHeight;

        //challengeItem.answer.push(answerItem);

        this.ChallengeValut.put(challengeId, challengeItem.answer.push(answerItem));
    },

    GetChallenge: function(challengeId){

        return this.ChallengeValut.get(challengeId);
    },

    VoteAnswer: function(challengeId,answerId,result){

        var voter = Blockchain.transaction.from;

        var choose = result.toString();

        var answerItem = this.ChallengeValut.get(challengeId).answer;

        for(var j = 0, length2 = answerItem.length; j < length2; j++){

            if (answerItem[j].answerId === answerId){

                if (choose){
                    //answerItem[j].like = answerItem[j].like + 1;

                    this.ChallengeValut.put(challengeId,answerItem[j].like.push(voter));
                }
                else {

                    this.ChallengeValut.put(challengeId,answerItem[j].dislike.push(voter));
                }

                break;
            }
        }

    },
    sortLike: function(a,b){
        if (a.like.length < b.like.length) {
                return 1;
        }
        else {
                return -1;
        }
    },
    tokenTansfer:function (_from,_to, _value) {

        this.ChallengeValut.transferFrom(_from,_to,_value);

        Event.Trigger("ChallengeValut", {
            Transfer: {
                from: _from,
                to: _to,
                value: _value
            }
        });
    },
    RewardAll: function (challengeId) {

        var from = Blockchain.transaction.from;
        var challengeItem = this.ChallengeValut.get(challengeId);
        var answerItem = challengeItem.answer;
        var limit = Blockchain.block.blockHeight.sub(challengeItem.blockHeight);
        var rewardAmount = new BigNumber(0);

        answerItem.sort(this.ChallengeValut.sortLike);

        if (from !== challengeItem.author) {
            throw new Error("Only for challenge developer");
        }
        if (answerItem.length === 0){
            throw new Error("No answer");
        }
        if (limit > blockLimit) {
            if (challengeItem.challengeLevel === "Diamond") {
                rewardAmount = Diamond;
            }
            else if (challengeItem.challengeLevel === "Gold"){
                rewardAmount = Gold;
            }
            else if (challengeItem.challengeLevel === "Silver"){
                rewardAmount = Silver;
            }
            else if (challengeItem.challengeLevel === "Brozen"){
                rewardAmount = Brozen;
            }
            var firstLevel = Math.ceil(rewardAmount*0.25);
            var secondLevel = Math.ceil(rewardAmount*0.15);
            var thirdLevel = Math.ceil(rewardAmount*0.1);
            var forthLevel = rewardAmount - firstLevel - secondLevel - thirdLevel - forthLevel;
            var answerAmount = new BigNumber(0);
            for (var j = 0; j < answerItem.length; j++ ){
                var answerLimit = answerItem[j].blockHeight - challengeItem.blockHeight;
                if(answerLimit > limit) {
                    answerAmount++;
                }
            }

            var firstSize = Math.floor(answerAmount*0.2);
            var secondSize = Math.floor(answerAmount*0.4);
            var thirdSize = answerAmount - firstSize - secondSize;

            for (var j_1 = 0; j_1 < firstSize; j_1++){
                var to_1 = answerItem[j_1].answered;
                var from_1 = this._admin;
                var amount_1 = Math.ceil(firstLevel/firstSize);
                this.tokenTansfer(from_1,to_1,amount_1);
            }

            for (var j_2 = 0; j_2 < secondSize; j_2++){
                var base_2 = j_2 + firstSize;
                var to_2 = answerItem[base_2].answered;
                var from_2 = this._admin;
                var amount_2 = Math.ceil(secondLevel/secondSize);
                this.tokenTansfer(from_2,to_2,amount_2);
            }

            for (var j_3 = 0; j_3<thirdSize; j_3++) {
                var base_3 = j_3+firstSize+secondSize;
                var to_3 = answerItem[base_3].answered;
                var from_3 = this._admin;
                var amount_3 = Math.ceil(thirdLevel/thirdSize);
                this.tokenTansfer(from_3,to_3,amount_3);
            }

            var forthSize = new BigNumber(0);
            for (var j_4 = 0;j<answerItem.length;j_4++){
                forthSize = forthSize + answerItem[j].like.length + answerItem[j_4].dislike.length;
            }
            forthSize++;
            var forthAmount = Math.ceil(forthLevel/forthSize);

            for (var j_5 =0;j_5<answerItem.length;j_5++){

                for (var i = 0; i<answerItem[j_5].like.length;i++){
                    var like_to = answerItem[j_5].like[i];
                    var like_from = this._admin;
                    this.tokenTansfer(like_from,like_to,forthAmount);
                }

                for (var k =0; k<answerItem[j_5].dislike.length;k++) {
                    var dislike_to = answerItem[j_5].dislike[i];
                    var dislike_from = this._admin;
                    this.tokenTansfer(dislike_from,dislike_to,forthAmount);
                }

            }

            this.tokenTansfer(this._admin,challengeItem.author,forthAmount);

        }
        else {
            throw new Error("Wait a minute.")
        }
    }

    // RewardAnswerFromPoster: function(challengeId) {
    //
    //     var answerItem = this.ChallengeValut.get(challengeId).answer;
    //
    //     var sortLike = function(a,b){
    //
    //         if (a.like.length < b.like.length) {
    //             return 1;
    //         }
    //         else {
    //             return -1;
    //         }
    //     };
    //
    //     answerItem.sort(sortLike);
    //
    //     for(var j = 0, length2 = 2; j < length2; j++){
    //
    //         if (answerItem[j].like > 2)
    //          {
    //             Event.Trigger("ChallengeValut", {
    //                 Transfer: {
    //                     from: Blockchain.transaction.from,
    //                     to: answerItem[j].answered,
    //                     value: Blockchain.transaction.value
    //                 }
    //             });
    //          }
    //     }
    //
    // },
    //
    // RewardChallenge: function(challengeId) {
    //
    //     var answerItem = this.ChallengeValut.get(challengeId).answer;
    //     var author = this.ChallengeValut.get(challengeId).author;
    //
    //     if (answerItem.length > 2){
    //
    //         Event.Trigger("ChallengeValut", {
    //             Transfer: {
    //                 from: Blockchain.transaction.from,
    //                 to: author,
    //                 value: Blockchain.transaction.value
    //             }
    //         });
    //     }
    // }


};

module.exports = challengeContract;

