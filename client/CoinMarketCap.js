import { heapCache } from './cache-heap'
import { withCached } from './cache'
import { BigNumber } from 'bignumber.js'
import fromPairs from 'lodash/fromPairs'
import { groupByKey } from './utils.js'

import request from 'request-promise-native'
import cheerio from 'cheerio'

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

const getAssets = withCached({
  group: 'assets',
  getKey: 'all',
  retrieve: async () => {
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
        BigNumber((/([0-9]{0,3}\.[0-9]+)%/.exec(c.text().trim()) || [, c.text().trim()])[1])
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

const getUrlFromId = id => `https://coinmarketcap.com/currencies/${id}`

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
}
