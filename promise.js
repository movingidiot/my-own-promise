function syncTask(func, ...args) {
    //process.nextTick(func, args);
    setTimeout(func, 0, args);
}

function resolutionProcedureFactory(resolvedPromise, toResolve, toReject) {
    const resolutionProcedure = (value) => {
        if (resolvingPromise === value) {
            toReject(new TypeError('not allowed to return father promise'));
        } else
            if (typeof value === 'object' || typeof value === 'function') {
                if (isPromise(value)) {
                    value.then(toResolve, toReject);
                } else
                    if (typeof value.then === 'function')
                        try {
                            value.then.call(value, y => resolutionProcedure(y), r => toReject(r));
                        } catch (err) {
                            toReject(err);
                        }
                    else {
                        toResolve(value);
                    }
            } else {
                toResolve(value);
            }
    }
    return resolutionProcedure;
}

class Promise{
    constructor(executor) {
        if (typeof executor !== 'function') {
            throw new TypeError('executor must be function');
        }
        const onFulfilled = [];
        const onRejected = [];
        const self = this;
        const resolve = function(value) {
            if (self.state === 'pending') {
                self.state = 'fulfilled';
                self.value = value;
                self.broadcast(onFulfilled,value);
                /*syncTask(function() {
                    onFulfilled.forEach(function (func) {
                        func(value);
                    });
                });*/    
            } else {
                //throw new Error('this promise has finished');
            }
        }
        const reject = function(reason) {
            if (self.state === 'pending') {
                self.state = 'rejected';
                self.value = reason;
                self.broadcast(onRejected,reason);
            } else {
                //throw new Error('this promise has finished');
            }    
        }
        this.state = 'pending';
        this.onFulfilled = onFulfilled;
        this.onRejected = onRejected;
        //syncTask(() => {
            executor(resolve, reject);
        //});
    }

    then(onFulfilled, onRejected) {
        let res, rej;
        const ans = new Promise((resolve, reject) => {
            res = resolve;
            rej = reject;
        });
        const wrapOnFulfilled = function (value) {
            if (typeof onFulfilled === 'function')
                try {
                    res(onFulfilled(value));
                }
                catch (err) {
                    rej(err);
                }
            else
                res(value);
        };
        const wrapOnRejected = function (value) {
            if (typeof onRejected === 'function')
                try {
                    res(onRejected(value));
                } catch (err) {
                    rej(err);
                }    
            else
                rej(value);
        }
        if (this.state === 'fulfilled')
            this.broadcast([wrapOnFulfilled], this.value);
        else
            this.onFulfilled.push(wrapOnFulfilled);
        if (this.state === 'rejected')
            this.broadcast([wrapOnRejected], this.value);
        else
            this.onRejected.push(wrapOnRejected);
        return ans;
    }

    broadcast(funcArr,value) {
        const self = this;
        syncTask(function () {
            funcArr.forEach(function (func) {
                    func(value);
            });
            funcArr = [];
        });
    }
}

const test = require('promises-aplus-tests');
const adapter = {
    deferred: function () {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            promise,
            resolve,
            reject
        }
    }
}
/*
const promise = new Promise((resolve, reject) => {
    setTimeout(reject, 50, 'asdf');
});
let count = 0;
const sentinel = new Object('sentinel');
const sentinel2 = new Object('sentinel2');
const sentinel3 = new Object('sentinel3');
function wake() {
    console.log(++count);
}

promise.then(null, function () {
    return sentinel;
}).then(function (value) {
    console.log(value === sentinel);
});

promise.then(null, function () {
    throw sentinel2;
}).then(null, function (reason) {
    console.log(reason === sentinel2);
});

promise.then(null, function () {
    return sentinel3;
}).then(function (value) {
    console.log(value === sentinel3);
});
*/

test(adapter, function (err) {
    console.dir(err);
});