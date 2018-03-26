import { BigNumber } from 'bignumber.js'
import { withCached } from '../cache'
import {
  fetchJson,
  applyTransforms,
  toBigPercent,
} from '../utils'
import { COINMARKETCAP_API_URI } from '../config'


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

export default getGlobalData
