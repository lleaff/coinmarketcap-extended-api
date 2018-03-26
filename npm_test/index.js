const CoinMarketCap = require('node-coinmarketcap-extended-api')

const CMC = new CoinMarketCap()

async function test() {
  const coins = await CMC.coins()
  console.log(coins[2])
}
