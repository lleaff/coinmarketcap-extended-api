import CoinMarketCap from '..'
import BigNumber from 'bignumber.js'

const isInt = n => n - Math.floor(n) === 0

const nullable = fn => (a, ...args) => a === null || fn(a, ...args)

const isTicker = ticker => ticker.match(/^[A-Za-z0-9@$]+$/)
const isNullableBigNumber = n => nullable(n => n instanceof BigNumber)

const AssetValidators = {
  id: id => id.match(/^[a-z0-9-]+$/),
  ticker: ticker => isTicker(ticker),
  rank: rank => isInt(rank),
  priceUsd: nullable(price => price instanceof BigNumber),
  priceBtc: nullable(price => price instanceof BigNumber),
  volumeUsd24h: nullable(price => price instanceof BigNumber),
  marketCapUsd: nullable(price => price instanceof BigNumber),
  availableSupply: nullable(price => price instanceof BigNumber),
  totalSupply: nullable(price => price instanceof BigNumber),
  maxSupply: nullable(price => price instanceof BigNumber),
  percentChange1h: nullable(price => price instanceof BigNumber),
  percentChange24h: nullable(price => price instanceof BigNumber),
  percentChange7d: nullable(price => price instanceof BigNumber),
  lastUpdated: lastUpdated => isNaN(lastUpdated) || (typeof lastUpdated === 'number' && lastUpdated > 0),
}

const MarketValidators = {
  pair: pair => pair.split('/').every(isTicker),
  volumeUsd: nullable(volume => volume instanceof BigNumber),
  priceUsd: nullable(price => price instanceof BigNumber),
  volumePercent: nullable(volume => volume instanceof BigNumber),
  url: url => typeof url === 'string',
}

const LinkValidator = {
  label: label => (typeof label === 'string' && label !== ''),
  url: url => (typeof url === 'string' && url !== ''),
}

const matchValidators = (received, argument) => {
  for (const [key, validator] of Object.entries(argument)) {
    if (!(key in received)) {
        return {
          message: () => `No key "${key}" in received "${received}".`,
          pass: false,
        }
    }
    if (typeof validator === 'function') {
      if (!validator(received[key])) {
        return {
          message: () => `Validator for key "${key}" not matching with "${received[key]}".`,
          pass: false,
        }
      }
    }
  }
  return {
    message: () => `All validators for ${received} matching.`,
    pass: true,
  }
}

expect.extend({
  toMatchValidators: matchValidators,

  toBeAsset(received) {
    return matchValidators(received, AssetValidators)
  },

  toBeMarket(received) {
    return matchValidators(received, MarketValidators)
  },

  toBeLink(received) {
    if (received.label === received.url) {
      return {
        message: () => `Label same as URL: "${received.label}"`,
        pass: false,
      }
    }
    return matchValidators(received, LinkValidator)
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
  describe('idFromTicker', async () => {
    it('Returns a coinmarketcap ID for a given ticker', async () => {
      const id = await CMC.idFromTicker('btc')
      expect(id).toEqual('bitcoin')
    })
  })

  describe('coin', async () => {
    it('Returns the Asset for a given ID', async () => {
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
      const coins = await CMC.coins()

      for (const coin of coins) {
        expect(coin).toBeAsset()
      }
    })
  })

  describe('coinFromTicker', async () => {
    it('Returns the Asset with the biggest marketcap for a given ticker', async () => {
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
      const markets = await CMC.getMarkets('bitcoin')
      for (const market of markets) {
        expect(market).toBeMarket()
      }
    })
  })

  describe('getMarketsFromTicker', async () => {
    it('Returns a list of Markets for a given ticker', async () => {
      const markets = await CMC.getMarketsFromTicker('BTC')
      for (const market of markets) {
        expect(market).toBeMarket()
      }
    })
  })

  describe('getMarkets', async () => {
    it('Returns a list of Markets for a given ID', async () => {
      const links = await CMC.getLinks('bitcoin')
      for (const link of links) {
        expect(link).toBeLink()
      }
    })
  })


  describe('getLinksFromTicker', async () => {
    it('Returns a list of Links for a given ticker', async () => {
      const links = await CMC.getLinksFromTicker('BTC')
      for (const link of links) {
        expect(link).toBeLink()
      }
    })
  })
}

describe('With built-in cache', async () => {
  const CMC = new CoinMarketCap()
  await apiTests(CMC)
})

// describe('With custom cache', () => {
//   const CMCcache = new CoinMarketCap({
//     cache: 'TODO',
//   })
//   apiTests(CMCcache)
// })
