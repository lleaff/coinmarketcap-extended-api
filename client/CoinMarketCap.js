import fromPairs from 'lodash/fromPairs'
import { defaultCache } from './cache-default'
import { withCached } from './cache'
import { BigNumber } from 'bignumber.js'
import { mapObjectValues, } from './utils'

import getAssets from './api/getAssets'
import getAssetPage from './api/getAssetPage'
import getGlobalData from './api/getGlobalData'

const convertBigNumberToPlain = result => {
  if (result instanceof BigNumber) {
    return result.toNumber()
  }
  if (!result) {
    return result
  } else if (typeof result === 'array') {
  } else if (typeof result === 'object') {
    if (Array.isArray(result)) {
      return result.map(convertBigNumberToPlain)
    }
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
      BigNumber=true,
    } = options

    if (!BigNumber) {
      const CMC_METHODS = [
        'idFromTicker',
        'coins',
        'coin',
        'coinFromTicker',
        'coinsFromTicker',
        'getMarkets',
        'getMarketsFromTicker',
        'getLinks',
        'getLinksFromTicker',
        'global',
      ]
      for (const method of CMC_METHODS) {
        const orig = this[method]
        this[method] = (async (...args) =>
          convertBigNumberToPlain(await orig.call(this, ...args))).bind(this)
      }
    }

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
