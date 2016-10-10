'use strict'

const Promise = function (fn) {
  const PENDING = 0
  const FULFILLED = 1
  const REJECTED = 2

  let state = PENDING
  let value = null
  let handlers = []

  const fulfill = result => {
    state = FULFILLED
    value = result
    handlers.forEach(handler => handler.onFulfilled(value))
  }

  const reject = error => {
    state = REJECTED
    value = error
    handlers.forEach(handler => handler.onRejected(value))
  }

  const resolve = result => {
    try {
      let then = getThen(result)
      if (then) return doResolve(then.bind(result), resolve, reject)
      fulfill(result)
    } catch (e) {
      reject(e)
    }
  }

  const handle = handler => {
    if (state == PENDING) {
      handlers.push(handler)
    } else {
      if (state == FULFILLED && typeof handler.onFulfilled == 'function') {
        handler.onFulfilled(value)
      }
      if (state == REJECTED && typeof handler.onRejected == 'function') {
        handler.onRejected(value)
      }
    }
  }

  this.done = (onFulfilled, onRejected) => {
    setTimeout(() => {
      handle({ onFulfilled, onRejected })
    }, 0)
  }

  this.then = (onFulfilled, onRejected) => {
    return new Promise((resolve, reject) => {
      this.done(result => {
        if (typeof onFulfilled == 'function') {
          try {
            return resolve(onFulfilled(result))
          } catch (e) {
            return reject(e)
          }
        } else {
          return resolve(result)
        }
      }, error => {
        if (typeof onRejected == 'function') {
          try {
            return resolve(onRejected(error))
          } catch (e) {
            return reject(e)
          }
        } else {
          return reject(error)
        }
      })
    })
  }

  doResolve(fn, resolve, reject)
}

const getThen = value => {
  let t = typeof value
  if (value && (t == 'object' || t == 'function')) {
    let then = value.then
    if (typeof then == 'function') return then
  }
}

const doResolve = (fn, onFulfilled, onRejected) => {
  let done = false
  try {
    fn(value => {
      if (done) return
      done = true
      onFulfilled(value)
    }, reason => {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (e) {
    if (done) return
    done = true
    onRejected(e)
  }
}

const delay = n => {
  return new Promise((resolve, reject) => {
    setTimeout(() => console.log(n) || resolve(n), 1000)
  })
}

delay(0)
  .then(n => delay(n + 1))
  .then(n => delay(n + 1))
  .then(n => delay(n + 1))
