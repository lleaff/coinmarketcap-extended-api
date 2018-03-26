import BigNumber from 'bignumber.js'
import request from 'request-promise-native'
import { withCached } from '../cache'
import {
  applyTransforms,
  fetchJson,
  groupByKey,
  toBigPercent,
} from '../utils'
import { COINMARKETCAP_API_URI } from '../config'

const maybe = fn => val => val === null ? null : fn(val)

/*
  {
    id:                'pillar',
    name:              'Pillar',
    symbol:            'PLR',
    rank:              '100',
    price_usd:         '0.601898', <- max places seen in top 100: 9
    price_btc:         '0.00006283',
    24h_volume_usd:    '167863.0',
    market_cap_usd:    '136862456.0',
    available_supply:  '227384800.0',
    total_supply:      '800000000.0',
    max_supply:         null,
    percent_change_1h:  '2.69',
    percent_change_24h: '9.84',
    percent_change_7d:  '-22.68',
    last_updated:       '1520824152'
  }
*/
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
    transform: maybe(toBigPercent), },
  { key: 'percent_change_24h', newKey: 'percentChange24h',
    transform: maybe(toBigPercent), },
  { key: 'percent_change_7d', newKey: 'percentChange7d',
    transform: maybe(toBigPercent), },
  { key: 'last_updated', newKey: 'lastUpdated',
    transform: sec => parseInt(sec), },
]

const getAssets = withCached({
  group: 'assets',
  getKey: 'all',
  retrieve: async () => {
    const result = await fetchJson(`${COINMARKETCAP_API_URI}/ticker/?limit=0`, {
      errorPrefix: 'getAssets',
    })
    const assets = result.map(a => applyTransforms(a, TICKER_TRANSFORMS))
    const tickers = groupByKey(assets, 'ticker')
    const ids = new Map(assets.map(a => [a.id, a]))
    return {
      assets,
      byTicker: ticker => tickers.get(ticker.toUpperCase()),
      byId: id => ids.get(id),
    }
  }
})

export default getAssets
