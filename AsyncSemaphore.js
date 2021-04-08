// AsyncSemaphore thanks to this article: https://alexn.org/blog/2020/04/21/javascript-semaphore.html
export class AsyncSemaphore {
  _available//: number
  _upcoming //: Function[]
  _heads //: Function[]

  _completeFn //!: () => void
  _completePr //!: Promise<void>

  constructor(/*public readonly*/ workersCount/*: number*/) {
    if (workersCount <= 0) throw new Error("workersCount must be positive")
    this._available = workersCount
    this._upcoming = []
    this._heads = []
    this._refreshComplete()
  }

  async withLock/*<A>*/(f/*: () => Promise<A>*/)/*: Promise<A>*/ {
    await this._acquire()
    return this._execWithRelease(f)
  }

  async withLockRunAndForget/*<A>*/(f/*: () => Promise<A>*/)/*: Promise<void>*/ {
    await this._acquire()
    // Ignoring returned promise on purpose!
    this._execWithRelease(f)
  }

  async awaitTerminate()/*: Promise<void>*/ {
    if (this._available < this.workersCount) {
      return this._completePr
    }
  }

  async _execWithRelease/*<A>*/(f/*: () => Promise<A>*/)/*: Promise<A>*/ {
    try {
      return await f()
    } finally {
      this._release()
    }
  }

  _queue()/*: Function[]*/ {
    if (!this._heads.length) {
      this._heads = this._upcoming.reverse()
      this._upcoming = []
    }
    return this._heads
  }

  _acquire()/*: void | Promise<void>*/ {
    if (this._available > 0) {
      this._available -= 1
      return undefined
    } else {
      let fn/*: Function*/ = () => {/***/}
      const p = new Promise/*<void>*/(ref => { fn = ref })
      this._upcoming.push(fn)
      return p
    }
  }

  _release()/*: void*/ {
    const queue = this._queue()
    if (queue.length) {
      const fn = queue.pop()
      if (fn) fn()
    } else {
      this._available += 1

      if (this._available >= this.workersCount) {
        const fn = this._completeFn
        this._refreshComplete()
        fn()
      }
    }
  }

  _refreshComplete()/*: void*/ {
    let fn/*: () => void*/ = () => {/***/}
    this._completePr = new Promise/*<void>*/(r => { fn = r })
    this._completeFn = fn
  }
}