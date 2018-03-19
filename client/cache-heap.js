export default class HeapCache {
  constructor(init) {
    this.store = new Map(init)
  }

  async set(key, value) {
    this.store.set(key, value)
    return value
  }

  async get(key) {
    return this.store.get(key)
  }

  async has(key) {
    return this.store.has(key)
  }
}
