import BigNumber from 'bignumber.js'

const isInt = n => n - Math.floor(n) === 0
const isBigNumber = n => n instanceof BigNumber

const nullable = fn => (a, ...args) => a === null || fn(a, ...args)

const isTicker = ticker => ticker.match(/^[A-Za-z0-9@$]+$/)
const isNullableBigNumber = n => nullable(n => isBigNumber(n))

export const AssetValidators = {
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
}

export const MarketValidators = {
  pair: pair => pair.split('/').every(isTicker),
  volumeUsd: nullable(volume => isBigNumber(volume)),
  priceUsd: nullable(price => isBigNumber(price)),
  volumePercent: nullable(percent => isBigNumber(percent)),
  url: url => typeof url === 'string',
}

export const LinkValidators = {
  label: label => (typeof label === 'string' && label !== ''),
  url: url => (typeof url === 'string' && url !== ''),
}

export const globalDataValidators = {
  totalMarketCapUsd: marketcap => isBigNumber(marketcap),
  total24hVolumeUsd: volume => isBigNumber(volume),
  bitcoinDominance: percent => isBigNumber(percent),
  activeCurrencies: count => isInt(count),
  activeAssets: count => isInt(count),
  activeMarkets: count => isInt(count),
  lastUpdated: lastUpdated => isNaN(lastUpdated) || (typeof lastUpdated === 'number' && lastUpdated > 0),
}

export const matchValidators = (received, argument) => {
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
          message: () => `Validator for key "${key}" of ${JSON.stringify(received)} not matching with: ${received[key]}.`,
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
