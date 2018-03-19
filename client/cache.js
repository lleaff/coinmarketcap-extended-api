export function withCached({ group, getKey=(k => k), retrieve }) {
  return async function withCachedResult(cache, ...args) {
    const key = `${group}:${typeof getKey === 'string' ? getKey : getKey(...args)}`
    if (await cache.has(key)) {
      return await cache.get(key)
    } else {
      const result = await retrieve(...args)
      await cache.set(key, result)
      return result
    }
  }
}
