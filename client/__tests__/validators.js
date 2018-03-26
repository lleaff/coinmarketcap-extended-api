import BigNumber from 'bignumber.js'

const isInt = n => n - Math.floor(n) === 0
const isNumber = n => n instanceof Number

const nullable = fn => (a, ...args) => a === null || fn(a, ...args)

const isTicker = ticker => ticker.match(/^[A-Za-z0-9@$]+$/)
const isNullableBigNumber = n => nullable(n => isBigNumber(n))

/*------------------------------------------------------------*/

export const getValidators = ({ useBigNumber=true }) => {

  const isBigNumber = useBigNumber ?
    n => n instanceof BigNumber :
    n => typeof n === 'number'

  return ({

    AssetValidators: {
      id: id => id.match(/^[a-z0-9-]+$/),
      ticker: ticker => isTicker(ticker),
      rank: rank => isInt(rank),
      priceUsd: nullable(price => isBigNumber(price)),
      priceBtc: nullable(price => isBigNumber(price)),
      volumeUsd24h: nullable(volume => isBigNumber(volume)),
      marketCapUsd: nullable(marketcap => isBigNumber(marketcap)),
      availableSupply: nullable(supply => isBigNumber(supply)),
      totalSupply: nullable(supply => isBigNumber(supply)),
      maxSupply: nullable(supply => isBigNumber(supply)),
      percentChange1h: nullable(percent => isBigNumber(percent)),
      percentChange24h: nullable(percent => isBigNumber(percent)),
      percentChange7d: nullable(percent => isBigNumber(percent)),
      lastUpdated: lastUpdated => isNaN(lastUpdated) || (typeof lastUpdated === 'number' && lastUpdated > 0),
    },

    MarketValidators: {
      pair: pair => pair.split('/').every(isTicker),
      volumeUsd: nullable(volume => isBigNumber(volume)),
      priceUsd: nullable(price => isBigNumber(price)),
      volumePercent: nullable(percent => isBigNumber(percent)),
      url: url => typeof url === 'string',
    },

    LinkValidators: {
      label: label => (typeof label === 'string' && label !== ''),
      url: url => (typeof url === 'string' && url !== ''),
    },

    GlobalDataValidators: {
      totalMarketCapUsd: marketcap => isBigNumber(marketcap),
      total24hVolumeUsd: volume => isBigNumber(volume),
      bitcoinDominance: percent => isBigNumber(percent),
      activeCurrencies: count => isInt(count),
      activeAssets: count => isInt(count),
      activeMarkets: count => isInt(count),
      lastUpdated: lastUpdated => isNaN(lastUpdated) || (typeof lastUpdated === 'number' && lastUpdated > 0),
    },

  })

}

const {
  AssetValidators,
  MarketValidators,
  LinkValidators,
  GlobalDataValidators,
} = getValidators({ useBigNumber: true, })

const {
  AssetValidators: AssetValidatorsNoBigNum,
  MarketValidators: MarketValidatorsNoBigNum,
  GlobalDataValidators: GlobalDataValidatorsNoBigNum,
} = getValidators({ useBigNumber: false, })

export {
  AssetValidators,
  MarketValidators,
  LinkValidators,
  GlobalDataValidators,
  AssetValidatorsNoBigNum,
  MarketValidatorsNoBigNum,
  GlobalDataValidatorsNoBigNum,
}

/*------------------------------------------------------------*/

export const matchValidators = (received, argument) => {
  if (!argument) {
    return {
      message: () => `No validators received for ${JSON.stringify(received)}: ${argument}`,
      pass: false,
    }
  }
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
          message: () => `Validator for key "${key}" of ${JSON.stringify(received)} not matching with: ${received[key]} (type: "${typeof received}").`,
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
