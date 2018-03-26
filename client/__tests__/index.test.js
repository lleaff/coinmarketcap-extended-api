import CoinMarketCap from '..'

import { spyOnMethods } from './test-utils'
import {
  matchValidators,
  AssetValidators,
  MarketValidators,
  LinkValidators,
  GlobalDataValidators,
  AssetValidatorsNoBigNum,
  MarketValidatorsNoBigNum,
  GlobalDataValidatorsNoBigNum,
} from './validators'

expect.extend({
  toMatchValidators: matchValidators,

  toBeAsset(received) {
    return matchValidators(received, AssetValidators)
  },

  toBeMarket(received) {
    return matchValidators(received, MarketValidators)
  },

  toBeAssetNoBigNum(received) {
    return matchValidators(received, AssetValidatorsNoBigNum)
  },

  toBeMarketNoBigNum(received) {
    return matchValidators(received, MarketValidatorsNoBigNum)
  },

  toBeLink(received) {
    if (received.label === received.url) {
      return {
        message: () => `Label same as URL: "${received.label}"`,
        pass: false,
      }
    }
    return matchValidators(received, LinkValidators)
  }
})

/*
 * Example direct API call result:
 * {
 *   "id": "bitcoin", 
 *   "name": "Bitcoin", 
 *   "symbol": "BTC", 
 *   "rank": "1", 
 *   "price_usd": "9329.12", 
 *   "price_btc": "1.0", 
 *   "24h_volume_usd": "6127000000.0", 
 *   "market_cap_usd": "157827486652", 
 *   "available_supply": "16917725.0", 
 *   "total_supply": "16917725.0", 
 *   "max_supply": "21000000.0", 
 *   "percent_change_1h": "1.1", 
 *   "percent_change_24h": "1.02", 
 *   "percent_change_7d": "-13.58", 
 *   "last_updated": "1520989767"
 *   }
 *
 *   Example Asset:
 * {
 *   "availableSupply": "16917725",
 *   "id": "bitcoin",
 *   "lastUpdated": 1520989767,
 *   "marketCapUsd": "157827486652",
 *   "maxSupply": "21000000",
 *   "name": "Bitcoin",
 *   "percentChange1h": "1.1",
 *   "percentChange24h": "1.02",
 *   "percentChange7d": "-13.58",
 *   "priceBtc": "1",
 *   "priceUsd": "9329.12",
 *   "rank": 1,
 *   "ticker": "BTC",
 *   "totalSupply": "16917725",
 *   "volumeUsd24h": "6127000000",
 * }
 */

const apiTests = async (CMC) => {
  describe('API:', async () => {
    describe('idFromTicker', async () => {
      it('Returns a coinmarketcap ID for a given ticker', async () => {
        expect.assertions(1)
        const id = await CMC.idFromTicker('btc')
        expect(id).toEqual('bitcoin')
      })
    })

    describe('coin', async () => {
      it('Returns the Asset for a given ID', async () => {
        expect.assertions(2)
        const assetBitcoin = await CMC.coin('bitcoin')

        expect(assetBitcoin).toBeAsset()
        expect(assetBitcoin).toMatchObject({
          id: 'bitcoin',
          ticker: 'BTC',
        })
      })
    })

    describe('coins', async () => {
      it('Returns every Asset on CoinMarketCap', async () => {
        expect.hasAssertions()
        const coins = await CMC.coins()

        for (const coin of coins) {
          expect(coin).toBeAsset()
        }
      })

      it(`Has the same number of assets as global data's combined activeAssets and activeCurrencies`, async () => {
        expect.assertions(1)
        const [ coins, global ] = await Promise.all([ CMC.coins(), CMC.global() ])
        expect(global.activeAssets + global.activeCurrencies).toEqual(coins.length)
      })
    })

    describe('coinFromTicker', async () => {
      it('Returns the Asset with the biggest marketcap for a given ticker', async () => {
        expect.assertions(2)
        const assetBitcoin = await CMC.coinFromTicker('BTC')

        expect(assetBitcoin).toBeAsset()
        expect(assetBitcoin).toMatchObject({
          id: 'bitcoin',
          ticker: 'BTC',
        })
      })
    })

    describe('coinsFromTicker', async () => {
      it('Returns all possible Assets for a given ticker', async () => {
        expect.hasAssertions()
        const assetsBTC = await CMC.coinsFromTicker('BTC')

        for (const asset of assetsBTC) {
          expect(asset).toBeAsset()
        }
        expect(assetsBTC[0]).toMatchObject({
          id: 'bitcoin',
          ticker: 'BTC',
        })
      })
    })

    describe('getMarkets', async () => {
      it('Returns a list of Markets for a given ID', async () => {
        expect.hasAssertions()
        const markets = await CMC.getMarkets('bitcoin')
        for (const market of markets) {
          expect(market).toBeMarket()
        }
      })
    })

    describe('getMarketsFromTicker', async () => {
      it('Returns a list of Markets for a given ticker', async () => {
        expect.hasAssertions()
        const markets = await CMC.getMarketsFromTicker('BTC')
        for (const market of markets) {
          expect(market).toBeMarket()
        }
      })
    })

    describe('getLinks', async () => {
      it('Returns a list of Markets for a given ID', async () => {
        expect.hasAssertions()
        const links = await CMC.getLinks('bitcoin')
        expect(links.some(link => /^http:\/\//.test(link.url))).toBe(true)
        for (const link of links) {
          expect(link).toBeLink()
        }
      })
    })


    describe('getLinksFromTicker', async () => {
      it('Returns a list of Links for a given ticker', async () => {
        expect.hasAssertions()
        const links = await CMC.getLinksFromTicker('BTC')
        for (const link of links) {
          expect(link).toBeLink()
        }
      })
    })

    describe('global', async () => {
      it('Returns CoinMarketCap global data', async () => {
        expect.hasAssertions()
        const globalData = await CMC.global()
        expect(globalData).toMatchValidators(GlobalDataValidators)
      })
    })
  })
}

const cacheTests = async (CMC) => {
  const cache = CMC.cache
  describe('Cache', async () => {
    describe('Retrieve function is not called on a second call with the same arguments', async () => {
      it('.coin', async () => {
        expect.assertions(5)
        cache.get.mockClear(); cache.set.mockClear(); cache.has.mockClear();
        const coin1 = await CMC.coin('bitcoin')
        const coin2 = await CMC.coin('bitcoin')
        const coin3 = await CMC.coin('bitcoin')
        expect(coin1).toEqual(coin2)
        expect(coin1).toEqual(coin3)
        expect(cache.has).toHaveBeenCalledTimes(3)
        expect(cache.set).toHaveBeenCalledTimes(1)
        expect(cache.get).toHaveBeenCalledTimes(2)
      })

      it('.getMarkets', async () => {
        expect.assertions(5)
        cache.get.mockClear(); cache.set.mockClear(); cache.has.mockClear();
        const markets1 = await CMC.getMarkets('bitcoin')
        const markets2 = await CMC.getMarkets('bitcoin')
        const markets3 = await CMC.getMarkets('bitcoin')
        expect(markets1).toEqual(markets2)
        expect(markets1).toEqual(markets3)
        expect(cache.has).toHaveBeenCalledTimes(3)
        expect(cache.set).toHaveBeenCalledTimes(1)
        expect(cache.get).toHaveBeenCalledTimes(2)
      })

      it('.getLinks', async () => {
        expect.assertions(5)
        cache.get.mockClear(); cache.set.mockClear(); cache.has.mockClear();
        const links1 = await CMC.getLinks('bitcoin')
        const links2 = await CMC.getLinks('bitcoin')
        const links3 = await CMC.getLinks('bitcoin')
        expect(links1).toEqual(links2)
        expect(links1).toEqual(links3)
        // We have the asset page data from .getMarkets test, so no fetching
        // should occur here.
        expect(cache.has).toHaveBeenCalledTimes(3)
        expect(cache.set).toHaveBeenCalledTimes(0)
        expect(cache.get).toHaveBeenCalledTimes(3)
      })

      it('.global', async () => {
        expect.assertions(5)
        cache.get.mockClear(); cache.set.mockClear(); cache.has.mockClear();
        const global1 = await CMC.global()
        const global2 = await CMC.global()
        const global3 = await CMC.global()
        expect(global1).toEqual(global2)
        expect(global1).toEqual(global3)
        expect(cache.has).toHaveBeenCalledTimes(3)
        expect(cache.set).toHaveBeenCalledTimes(1)
        expect(cache.get).toHaveBeenCalledTimes(2)
      })
    })
  })
}

describe('With built-in cache', async () => {
  const CMC = new CoinMarketCap()
  await apiTests(CMC)
})

describe('With built-in cache', async () => {
  const CMC = new CoinMarketCap()
  CMC.cache = spyOnMethods(CMC.cache)
  await cacheTests(CMC)
})

describe('With custom cache', async () => {
  const CacheStore = { store: {} }
  const cache = {
    get: async (key) => CacheStore.store[key],
    set: async (key, val) => { CacheStore.store[key] = val; },
    has: async (key) => key in CacheStore.store,
    clear: async () => { CacheStore.store = {}; },
    store: CacheStore.store,
  }
  spyOnMethods(cache)
  const CMCcache = new CoinMarketCap({
    cache: cache,
  })

  await cacheTests(CMCcache)
})

describe('With vanilla JS numbers', async () => {
  const CMC = new CoinMarketCap({
    BigNumber: false,
  })

  describe('idFromTicker', async () => {
    it('Returns a coinmarketcap ID for a given ticker', async () => {
      expect.assertions(1)
      const id = await CMC.idFromTicker('btc')
      expect(id).toEqual('bitcoin')
    })
  })

  describe('coin', async () => {
    it('Returns the Asset for a given ID', async () => {
      expect.assertions(2)
      const assetBitcoin = await CMC.coin('bitcoin')

      expect(assetBitcoin).toBeAssetNoBigNum()
      expect(assetBitcoin).toMatchObject({
        id: 'bitcoin',
        ticker: 'BTC',
      })
    })
  })

  describe('coins', async () => {
    it('Returns every Asset on CoinMarketCap', async () => {
      expect.hasAssertions()
      const coins = await CMC.coins()

      for (const coin of coins) {
        expect(coin).toBeAssetNoBigNum()
      }
    })
  })

  describe('coinFromTicker', async () => {
    it('Returns the Asset with the biggest marketcap for a given ticker', async () => {
      expect.assertions(2)
      const assetBitcoin = await CMC.coinFromTicker('BTC')

      expect(assetBitcoin).toBeAssetNoBigNum()
      expect(assetBitcoin).toMatchObject({
        id: 'bitcoin',
        ticker: 'BTC',
      })
    })
  })

  describe('coinsFromTicker', async () => {
    it('Returns all possible Assets for a given ticker', async () => {
      expect.hasAssertions()
      const assetsBTC = await CMC.coinsFromTicker('BTC')

      for (const asset of assetsBTC) {
        expect(asset).toBeAssetNoBigNum()
      }
      expect(assetsBTC[0]).toMatchObject({
        id: 'bitcoin',
        ticker: 'BTC',
      })
    })
  })

  describe('getMarkets', async () => {
    it('Returns a list of Markets for a given ID', async () => {
      expect.hasAssertions()
      const markets = await CMC.getMarkets('bitcoin')
      for (const market of markets) {
        expect(market).toBeMarketNoBigNum()
      }
    })
  })

  describe('getMarketsFromTicker', async () => {
    it('Returns a list of Markets for a given ticker', async () => {
      expect.hasAssertions()
      const markets = await CMC.getMarketsFromTicker('BTC')
      for (const market of markets) {
        expect(market).toBeMarketNoBigNum()
      }
    })
  })

  describe('global', async () => {
    it('Returns CoinMarketCap global data', async () => {
      expect.hasAssertions()
      const globalData = await CMC.global()
      expect(globalData).toMatchValidators(GlobalDataValidatorsNoBigNum)
    })
  })
})
