import BigNumber from 'bignumber.js'
import fromPairs from 'lodash/fromPairs'
import { toBigPercent } from '../utils'

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

export default getMarkets 
