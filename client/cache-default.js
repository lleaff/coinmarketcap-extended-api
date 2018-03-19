import HeapCache from './cache-heap'

const getGroup = (key) => key.split(':')[0]

const validateConstructorOptions = (options) => {
  if (!options) { return true }
  const { init, expiry } = options

  if (init && typeof init === 'array') {
    throw new TypeError('options.init must be an array.')
  }
  const validateExpiryNumber = expiry => {
    if (typeof expiry !== 'number' || expiry < 0) {
      throw new TypeError('options.expiry time must be a positive number.')
    }
  }
  if (expiry) {
    if (typeof expiry === 'number') { validateExpiryNumber(expiry); }
    else {
      for (const [group, time] of Object.entries(expiry)) {
        validateExpiryNumber(time)
      }
      if (typeof expiry.default !== 'number') {
        throw new TypeError('options.expiry must have a "default" key.')
      }
    }
  }
}

const validateKey = (key) => {
  if (/!^(.*):[^:]+$/.test(key)) {
    throw new TypeError(`'key' argument must be a string of the form "group:itemKey", got: "${key}".`)
  }
}

/**
 * @param {Array} options.init - Store initial content, Map constructor argument
 * @param {int|{group:init}} options.expiry - Time in milliseconds before a
 *  cache entry is considered stale. Can be indicated as a global number, or
 *  an object with different durations for each group. Keys are group names and
 *  values the expiry time. The object should have a 'default' key.
 */
export default class DefaultCache extends HeapCache {
  constructor(options) {
    validateConstructorOptions(options)
    const {
      init,
      expiry=0,
    } = options || {}
    super(init)
    this.expiry = expiry
  }

  async set(key, value) {
    validateKey(key)
    return await super.set(key, { value: value, lastUpdated: Date.now(), })
  }

  async get(key) {
    const { value } = await super.get(key) || {}
    return value
  }

  async has(key) {
    if (!await super.has(key)) {
      return false
    }
    const { lastUpdated } = await super.get(key)
    return !this.isStale(key, lastUpdated)
  }

  isStale(key, lastUpdated) {
    const expiry = typeof this.expiry === 'number' ?
      this.expiry :
      (this.expiry[getGroup(key)] || this.expiry.default)
    return lastUpdated + expiry < Date.now()
  }

  async clear() {
    this.store = new Map()
  }
}

export const defaultCache = (...args) => new DefaultCache(...args)
