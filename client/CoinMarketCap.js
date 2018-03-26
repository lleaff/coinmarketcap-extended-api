import fromPairs from 'lodash/fromPairs'
import { defaultCache } from './cache-default'
import { withCached } from './cache'
import { BigNumber } from 'bignumber.js'
import {
  groupByKey,
  fetchJson,
  applyTransforms,
  mapObjectValues,
} from './utils'
import { COINMARKETCAP_URI, COINMARKETCAP_API_URI } from './config'

import request from 'request-promise-native'
import cheerio from 'cheerio'

const maybe = fn => val => val === null ? null : fn(val)

const log = (thing, msg, ...msgs) => console.log(msg || '', thing, ...msgs) || thing; //DEBUG

const toBigPercent = per => BigNumber(per).div(100)

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

const getMarkets = ($) => {
  try {
    const marketsRow = $('#markets-table > tbody tr').get()
    const rawMarketsHtml = marketsRow.map(r => $(r).children().get())
    const columns = [
      [],
      ['exchange', c =>
        c.text().trim()
      ],
      ['pair', c =>
        ({ pair: c.text().trim(), url: c.find('a').attr('href'), })
      ],
      ['volumeUsd', c =>
        BigNumber(c.find('span').data('usd'))
      ],
      ['priceUsd', c =>
        BigNumber(c.find('span').data('usd'))]
      ,
      ['volumePercent', c =>
        toBigPercent((/([0-9]{0,3}\.[0-9]+)%/.exec(c.text().trim()) || [, c.text().trim()])[1])
      ],
    ]

    const markets = rawMarketsHtml
      .map(row =>
        columns
        .map(([ column, transform ]=[], i) => column &&
          [ column, transform($(row[i])) ])
        .filter(a => a)
      )
      .map(fromPairs)
      .map(market => ({
        ...market,
        pair: market.pair.pair,
        url: market.pair.url,
      }))

    return markets
  } catch(e) {
    console.error('[getMarkets]: ', e)
  }
}

const getLinks = ($) => {
  try {
    const linksRows = $('div.row.bottom-margin-2x > div.col-sm-4.col-sm-pull-8:last-child > ul')
      .children().get()
    const rawLinksHtml = linksRows.map(r => $(r).find('a'))
      // Remove rows without a tag
      .filter(a => a.get()[0])
    const links = rawLinksHtml.map(a => ({
      label: a.text().trim(),
      url: a.attr('href'),
    }))
    return links
  } catch(e) {
    console.error('[getLinks]: ', e)
  }
}

const getUrlFromId = id => `${COINMARKETCAP_URI}/currencies/${id}`

const getAssetPage = withCached({
  group: 'assetpage',
  retrieve: async (id) => {
    const html = await request(getUrlFromId(id))
    const $ = cheerio.load(html)
    return {
      markets: getMarkets($),
      links: getLinks($),
    }
  },
})


/*
  {
    "total_market_cap_usd": 201241796675,
    "total_24h_volume_usd": 4548680009,
    "bitcoin_percentage_of_market_cap": 62.54,
    "active_currencies": 896,
    "active_assets": 360,
    "active_markets": 6439,
  }
 */

const GLOBAL_DATA_TRANSFORMS = [
  { key: 'total_market_cap_usd', newKey: 'totalMarketCapUsd',
    transform: marketcap => BigNumber(marketcap), },
  { key: 'total_24h_volume_usd', newKey: 'total24hVolumeUsd',
    transform: volume => BigNumber(volume), },
  { key: 'bitcoin_percentage_of_market_cap', newKey: 'bitcoinDominance',
    transform: toBigPercent, },
  { key: 'active_currencies', newKey: 'activeCurrencies', },
  { key: 'active_assets', newKey: 'activeAssets', },
  { key: 'active_markets', newKey: 'activeMarkets', },
  { key: 'last_updated', newKey: 'lastUpdated', },
]

const getGlobalData = withCached({
  group: 'global',
  getKey: 'all',
  retrieve: async () => {
    const result = await fetchJson(`${COINMARKETCAP_API_URI}/global`)
    return applyTransforms(result, GLOBAL_DATA_TRANSFORMS)
  }
})

const convertBigNumberToPlain = result => {
  if (result instanceof BigNumber) {
    return result.toNumber()
  }
  if (!result) {
    return result
  } else if (typeof result === 'array') {
    return result.map(convertBigNumberToPlain)
  } else if (typeof result === 'object') {
    return mapObjectValues(
      result,
      val => val instanceof BigNumber ? val.toNumber() : val)
  } else {
    return result
  }
}

export default class CoinMarketCap {
  constructor(options={}) {
    const {
      cache=defaultCache({
        expiry: {
          'assets': 5*60*1000,
          'assetspage': 5*60*1000,
          'global': 10*60*1000,
          'default': 5*60*1000,
        },
      }),
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

  getMarkets = async (id) => {
    return (await getAssetPage(this.cache, id)).markets
  }

  getMarketsFromTicker = async (ticker) => {
    return await this.getMarkets(await this.idFromTicker(ticker))
  }

  getLinks = async (id) => {
    return (await getAssetPage(this.cache, id)).links
  }

  getLinksFromTicker = async (ticker) => {
    return await this.getLinks(await this.idFromTicker(ticker))
  }

  global = async () => {
    return (await getGlobalData(this.cache))
  }
}
