const symbols = {
    state: Symbol('PromiseState'),
    value: Symbol('PromiseValue'),
};

function asyncTask(func, ...args) {
    const asyncFunc = process.nextTick || setImmediate || setTimeout;
    asyncFunc(func,...asyncFunc === setTimeout && args.unshift(0) && args || args);
}

function broadcast(funcArr, value) {
    asyncTask(function () {
        funcArr.forEach(function (func) {
            func(value);
        });
        funcArr = [];
    });
}

function resolutionProcedureFactory(targetPromise, toResolve, toReject) {
    return function resolutionProcedure(value) {
        if (targetPromise === value) {
            toReject(new TypeError('Chaining cycle detected for promise'));
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
                    then.call(value, y => (!called) && (called = true) && asyncTask(resolutionProcedure, y), r => (!called) && (called = true) && toReject(r));
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
                broadcast(onFulfilled, value);
            } else {
                //throw new Error('this promise has finished');
            }
        }
        const reject = function (reason) {
            if (self[symbols.state] === 'pending') {
                self[symbols.state] = 'rejected';
                self[symbols.value] = reason;
                broadcast(onRejected, reason);
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

        switch (this[symbols.state]) {
            case 'fulfilled': { broadcast([wrapOnFulfilled], this[symbols.value]); break; }
            case 'rejected': { broadcast([wrapOnRejected], this[symbols.value]); break; }
            case 'pending': { this.onFulfilled.push(wrapOnFulfilled); this.onRejected.push(wrapOnRejected); break; }
        }
        
        return ans;
    }

    catch(onRejected) {
        return this.then(null, onRejected);
    }

    static resolve(value) {
        return new Promise((resolve) => resolve(value));
    }

    static reject(reason) {
        return new Promise((resolve, reject) => reject(reason));
    }

    static race(...promises) {
        return new Promise((resolve, reject) => {
            promises.forEach(value => {
                value.then(resolve, reject);
            });
        });
    }

    static all(...promises) {
        return new Promise((resolve, reject) => {
            const length = promises.length;
            let count = 0;
            promises.forEach(element => {
                element.then((value) => ++count === length && resolve(value), reject);
            });
        });
    }


}

const test = require('promises-aplus-tests');
const tmp = function() {
    let count = 0;
    const x = Promise.resolve('asdf');
    Promise.resolve().then(() => x).then(value => console.log(value), reason => console.log(reason));
}

tmp();
//import test from 'promises-aplus-tests';
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




test(adapter, function (err) {
    console.dir(err);
});