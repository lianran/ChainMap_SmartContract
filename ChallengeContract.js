'use strict';

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
        this.like = new BigNumber(0);
        this.dislike = new BigNumber(0);
    }
    else {

    }
};

var challengeContract = function () {


    LocalContractStorage.defineProperties(this, {
        _name: null,
        _symbol: null,
        _decimals: null,
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

    init: function () {
        this._name = "ChainMap";
        this._symbol = "CMAP";
        this._decimals = 2 || 0;
        this._totalSupply = new BigNumber(10).pow(8).mul(new BigNumber(10).pow(this._decimals));

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

        //challengeItem.answer.push(answerItem);

        this.ChallengeValut.put(challengeId, challengeItem.answer.push(answerItem));
    },

    GetChallenge: function(challengeId){

        return this.ChallengeValut.get(challengeId);
    },

    VoteAnswer: function(challengeId,answerId,result){

        var from = Blockchain.transaction.from;

        var choose = new BigNumber(result);

        var answerItem = this.ChallengeValut.get(challengeId).answer;

        for(var j = 0, length2 = answerItem.length; j < length2; j++){

            if (answerItem[j].answerId == answerId){

                if (choose){
                    //answerItem[j].like = answerItem[j].like + 1;
                    this.ChallengeValut.put(challengeId,answerItem[j].like.add(choose))
                }
                else {

                    this.ChallengeValut.put(challengeId,answerItem[j].dislike.sub(choose))
                }

                break;
            }
        }

    },

    sortStamp: function(a,b){

        return a.timeStamp - b.timeStamp
    },

    RewardAnswerFromPoster: function(challengeId) {

        var answerItem = this.ChallengeValut.get(challengeId).answer;

        answerItem.sort(sortStamp);

        for(var j = 0, length2 = 2; j < length2; j++){

            if (answerItem[j].like > 2)
             {
                Event.Trigger("ChallengeValut", {
                    Transfer: {
                        from: Blockchain.transaction.from,
                        to: answerItem[j].answered,
                        value: Blockchain.transaction.value
                    }
                });
             }
        }

    },

    RewardChallenge: function(challengeId) {

        var answerItem = this.ChallengeValut.get(challengeId).answer;
        var author = this.ChallengeValut.get(challengeId).author;

        if (answerItem.length > 2){
            Event.Trigger("ChallengeValut", {
                Transfer: {
                    from: Blockchain.transaction.from,
                    to: author,
                    value: Blockchain.transaction.value
                }
            });
        }

    }


};

module.exports = challengeContract;

