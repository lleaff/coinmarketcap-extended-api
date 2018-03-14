import { heapCache } from './cache-heap'
import { withCached } from './cache'
import { BigNumber } from 'bignumber.js'
import fromPairs from 'lodash/fromPairs'

import request from 'request-promise-native'

const maybe = fn => val => val === null ? null : fn(val)

const log = (thing, msg, ...msgs) => console.log(msg || '', thing, ...msgs) || thing; //DEBUG

const TICKER_TRANSFORMS = [
  { key: 'id', newKey: 'id', },
  { key: 'name', newKey: 'name', },
  { key: 'symbol', newKey: 'ticker', },
  { key: 'rank', newKey: 'rank',
    transform: rank => parseInt(rank), },
  { key: 'price_usd', newKey: 'priceUsd',
    transform: maybe(price => BigNumber(price)), },
  { key: 'price_btc', newKey: 'priceBtc',
    transform: maybe(price => BigNumber(price)), },
  { key: '24h_volume_usd', newKey: 'volumeUsd24h',
    transform: maybe(price => BigNumber(price)), },
  { key: 'market_cap_usd', newKey: 'marketCapUsd',
    transform: maybe(supply => BigNumber(supply)), },
  { key: 'available_supply', newKey: 'availableSupply',
    transform: maybe(supply => BigNumber(supply)), },
  { key: 'total_supply', newKey: 'totalSupply',
    transform: maybe(supply => BigNumber(supply)), },
  { key: 'max_supply', newKey: 'maxSupply',
    transform: maybe(supply => BigNumber(supply)), },
  { key: 'percent_change_1h', newKey: 'percentChange1h',
    transform: maybe(per => BigNumber(per)), },
  { key: 'percent_change_24h', newKey: 'percentChange24h',
    transform: maybe(per => BigNumber(per)), },
  { key: 'percent_change_7d', newKey: 'percentChange7d',
    transform: maybe(per => BigNumber(per)), },
  { key: 'last_updated', newKey: 'lastUpdated',
    transform: sec => parseInt(sec), },
]

const formatAssetData = (raw, transforms) => fromPairs(transforms.map(
  ({ key, newKey, transform=(a=>a) }) => ([newKey, transform(raw[key])])
))

const groupByKey = (arr, key) => {
  const map = new Map()
  for (const obj of arr) {
    if (map.has(obj[key])) {
      map.get(obj[key]).push(obj)
    } else {
      map.set(obj[key], [obj])
    }
  }
  return map
}

const getAssets = withCached({
  group: 'ticker',
  retrieve: async (ticker) => {
    let requestOptions = {
      uri: `https://api.coinmarketcap.com/v1/ticker/?limit=0`,
      json: true,
    }
    let result
    try {
      result = await request(requestOptions)
      if (!result) {
        console.error(`[getAssets] Empty response: `, result)
      }
    } catch(e) {
      if (e.name !== 'RequestError') { throw(e) }
      if (e.cause && e.cause.code === 'ECONNREFUSED') {
        console.error(`[getAssets]: Couldn't connect. Error:\n`, e)
      }
    }
    const assets = result.map(a => formatAssetData(a, TICKER_TRANSFORMS))
    const tickers = groupByKey(assets, 'ticker')
    const ids = new Map(assets.map(a => [a.id, a]))
    return {
      assets,
      byTicker: ticker => tickers.get(ticker.toUpperCase()),
      byId: id => ids.get(id),
    }
  }
})

/*
{
  id: 'pillar',
  name:                 'Pillar',
  symbol:             'PLR',
  rank:               '100',
  price_usd:          '0.601898', <- max places een in top 100: 9
  price_btc:            '0.00006283',
  24h_volume_usd:     '167863.0',
  market_cap_usd:     '136862456.0',
  available_supply:   '227384800.0',
  total_supply:       '800000000.0',
  max_supply:         null,
  percent_change_1h:  '2.69',
  percent_change_24h: '9.84',
  percent_change_7d:  '-22.68',
  last_updated:       '1520824152'
}
*/

export default class CoinMarketCap {
  constructor(options={}) {
    const {
      cache=heapCache()
    } = options

    this.cache = cache
  }

  idFromTicker = async (ticker) => {
    const assets = await getAssets(this.cache)
    return assets.byTicker(ticker)[0].id
  }

  coins = async () => (await getAssets(this.cache)).assets

  coin = async (id) =>
    (await getAssets(this.cache)).byId(id)

  coinFromTicker = async (ticker) => {
    const assets = (await getAssets(this.cache)).byTicker(ticker)
    return assets && assets[0]
  }

  coinsFromTicker = async (ticker) =>
    (await getAssets(this.cache)).byTicker(ticker)


}
