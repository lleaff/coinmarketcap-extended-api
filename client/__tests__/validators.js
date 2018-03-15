import BigNumber from 'bignumber.js'

const isInt = n => n - Math.floor(n) === 0

const nullable = fn => (a, ...args) => a === null || fn(a, ...args)

const isTicker = ticker => ticker.match(/^[A-Za-z0-9@$]+$/)
const isNullableBigNumber = n => nullable(n => n instanceof BigNumber)

export const AssetValidators = {
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

export const MarketValidators = {
  pair: pair => pair.split('/').every(isTicker),
  volumeUsd: nullable(volume => volume instanceof BigNumber),
  priceUsd: nullable(price => price instanceof BigNumber),
  volumePercent: nullable(volume => volume instanceof BigNumber),
  url: url => typeof url === 'string',
}

export const LinkValidator = {
  label: label => (typeof label === 'string' && label !== ''),
  url: url => (typeof url === 'string' && url !== ''),
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


