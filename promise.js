const symbols = {
    state: Symbol('PromiseState'),
    value: Symbol('PromiseValue'),
};

function syncTask(func, ...args) {
    process.nextTick(func, args);
    //setTimeout(func, 0, args);
}

function resolutionProcedureFactory(targetPromise, toResolve, toReject) {
    const resolutionProcedure = (value) => {
        if (targetPromise === value) {
            toReject(new TypeError('not allowed to return self promise'));
        } else
        if (value && (typeof value === 'object' || typeof value === 'function')) {
            let then;
            try {
                then = value.then;
            } catch (err) {
                toReject(err);
                return;
            }
            if (typeof then === 'function') {
                let called = false;
                try {
                    then.call(value, y => (!called) && (called = true) && resolutionProcedure(y), r => (!called) && (called = true) && toReject(r));
                } catch (err) {
                    (!called) && (called = true) && toReject(err);
                }
            } else {
                toResolve(value);
            }
        } else {
            toResolve(value);
        }
    }
    return resolutionProcedure;
}

class Promise {
    constructor(executor) {
        if (typeof executor !== 'function') {
            throw new TypeError('executor must be function');
        }
        const onFulfilled = [];
        const onRejected = [];
        const self = this;
        const resolve = function (value) {
            if (self[symbols.state] === 'pending') {
                self[symbols.state] = 'fulfilled';
                self[symbols.value] = value;
                self.broadcast(onFulfilled, value);
            } else {
                //throw new Error('this promise has finished');
            }
        }
        const reject = function (reason) {
            if (self[symbols.state] === 'pending') {
                self[symbols.state] = 'rejected';
                self[symbols.value] = reason;
                self.broadcast(onRejected, reason);
            } else {
                //throw new Error('this promise has finished');
            }
        }
        this[symbols.state] = 'pending';
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
        const resolutionProcedure = resolutionProcedureFactory(ans, res, rej);
        const wrapOnFulfilled = function (value) {
            if (typeof onFulfilled === 'function')
                try {
                    resolutionProcedure(onFulfilled(value));
                }
            catch (err) {
                rej(err);
            } else
                res(value);
        };
        const wrapOnRejected = function (value) {
            if (typeof onRejected === 'function')
                try {
                    resolutionProcedure(onRejected(value));
                } catch (err) {
                    rej(err);
                }
            else
                rej(value);
        }

        if (this[symbols.state] === 'fulfilled')
            this.broadcast([wrapOnFulfilled], this[symbols.value]);
        else
            this.onFulfilled.push(wrapOnFulfilled);
        if (this[symbols.state] === 'rejected')
            this.broadcast([wrapOnRejected], this[symbols.value]);
        else
            this.onRejected.push(wrapOnRejected);
        return ans;
    }

    broadcast(funcArr, value) {
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
/*
const promise = new Promise((resolve, reject) => resolve(1));
promise.then((value) => {
    const x = {
        then: function (resolvePromise) {
            const y = {
                then: function (onFulfilled) {
                    onFulfilled({
                        then: function (onFulfilled) {
                            setTimeout(onFulfilled, 0, 'asdf');
                        }
                    });
                    throw 'oij';
                }
            }
            resolvePromise(y);
        }
    };
    return x;
}, () => {
    console.log(123);
}).then((value)=>console.log(value));*/



test(adapter, function (err) {
    console.dir(err);
});