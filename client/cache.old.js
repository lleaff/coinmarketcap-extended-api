const getUrlFromId = id => `https://coinmarketcap.com/currencies/${id}`

export const marketsPage = coin => (`${coin.url}/#markets`)

export async function refreshCache(cache, options={}) {
  let requestOptions = {
    uri: `https://api.coinmarketcap.com/v1/ticker/`,
    json: true,
  }
  if ('timeout' in options) {
    requestOptions['timeout'] = options['timeout']
  }
  const coins = await request(requestOptions)
  const byTicker = new Map(coins.map(c => [
    c.symbol,
    {
      ...c,
      url: getUrlFromId(c.id)
    }
  ]))
  cache = {
    byTicker,
    lastUpdated: new Date(),
  }
  return cache
}

const HOUR = 60 * 60 * 1000
const CACHE_PEREMPTION = HOUR * 6

export async function refreshCacheIfOld(options) {
  if (cache && cache.lastUpdated + CACHE_PEREMPTION < new Date()) {
    return
  }
  return await refreshCache(options)
}


