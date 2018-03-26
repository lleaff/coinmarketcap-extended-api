import request from 'request-promise-native'
import cheerio from 'cheerio'
import { withCached } from '../cache'
import { COINMARKETCAP_URI } from '../config'

import getLinks from './getLinks'
import getMarkets from './getMarkets'

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

export default getAssetPage
