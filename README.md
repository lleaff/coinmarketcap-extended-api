# CoinMarketCap extended API

Node.js client for accessing [CoinMarketCap](https://coinmarketcap.com/) data.

Uses a local cache to avoid re-fetching coin info too frequently.
The cache can be configured or overriden.

## Installation

```sh
npm install https://github.com/lleaff/coinmarketcap-extended-api.git
```

## Usage

```javascript
import CoinMarketCap from 'coinmarketcap-extended-api'
const CMC = new CoinMarketCap()

CMC.getMarketsFromTicker('ETH')
  .then(markets => {
    for (const market of markets) {
      console.log(`ETH trades at ${market.priceUsd} USD on ${market.exchange}.`)
    }
  })
```

## API

### Constructor:

* **`new CoinMarketCap([options]): APIInstance`**  
  * `options`: Object with any of the below properties:  
    * `cache`: Can be used to override the default in-JS heap cache.  
               Must be an object with `has`, `get` and `set` methods.  

      The default cache is managed automatically (invalidated after 6 hours by default), and can also be refreshed manually by calling `refreshCache`.


### Instance methods:

* **`idFromTicker(ticker): Promise<id>`**  

* **`coins(): Promise<[Asset]>`**  

* **`coin(id): Promise<Asset>`**  

* **`coinFromTicker(ticker): Promise<Asset>`**  

* **`coinsFromTicker(ticker): Promise<Asset>`**  

* **`getMarkets(id): Promise<[Market]>`**  
1aw
* **`getMarketsFromTicker(ticker): Promise<[Market]>`**  

* **`getLinks(id): Promise<[Link]>`**  

* **`getLinksFromTicker(ticker): Promise<[Link]>`**  

### Instance properties:

* **`cache`**: Cache object optionally provided in constructor. Must have `has`, `get` and `set` methods. You typically won't need to interact with it directly, but it is provided as an escape hatch for finer grained control.  
    * `get(key: string): JSONSerializable`
    * `has(key: string): boolean`
    * `set(key: string, value: JSONSerializable)`

### Types:

* **`ticker`**: `string`: Symbol of asset on CoinMarketCap (e.g.: `"BTC"`)  

* **`id`**: `string`: ID of asset on CoinMarketCap (e.g.: `"golem-network-tokens"`). Be advised that there is no reliable way to infer it programmatically from other informations.  

* **`Asset`**: Information related to a particular asset/cryptocurrency.
  * **`id`**: `string`
  * **`name`**: `string`
  * **`symbol`**: `string`
  * **`rank`**: `int`
  * **`priceUsd`**: `BigNumber?` (USD)
  * **`priceBtc`**: `BigNumber?` (BTC)
  * **`volumeUsd24h`**: `BigNumber?` (USD)
  * **`marketCapUsd`**: `BigNumber?` (USD)
  * **`availableSupply`**: `BigNumber?` (tokens)
  * **`totalSupply`**: `BigNumber?` (tokens)
  * **`maxSupply`**: `BigNumber?` (tokens)
  * **`percentChange1h`**: `BigNumber?`
  * **`percentChange24h`**: `BigNumber?`
  * **`percentChange7d`**: `BigNumber?`
  * **`lastUpdated`**: `int` (seconds): UNIX time.

* **`Market`**: Information related to a particular trading pair.
  * **`exchange`**: `string`: Name of the exchange.
  * **`base`**: `ticker`: Name of the base currency.
  * **`quote`**: `ticker`: Name of the traded asset.
  * **`url`**: `string`: URL to trading pair on exchange.
  * **`volumeUsd24h`**: `BigNumber` (USD)
  * **`priceUsd`**: `BigNumber` (USD)
  * **`volumePercent`**: `BigNumber`: Percent of market 24h volume on global quote trading 24h volume.

* **`Link`**: Links related to the asset.
  * **`label`**: `string` Resource label
  * **`url`**: `string`: Resource URL

## Configuring the cache:

The default cache can be configured with expiry for all entries. Default is 5 minutes: 

```javascript
import CoinMarketCap, { defaultCache } from 'coinmarketcap-extended-api'

const CMC = new CoinMarketCap({
  cache: defaultCache({
    expiry: 30e3, // Expire cache entries after 30 seconds
  }),
})
```
Or configure the expiry of different type of cache entries individually: 

```javascript
const CMC = new CoinMarketCap({
  cache: defaultCache({
    expiry: {
      assets: 2*60*1000, // Expire after 2 minutes
      assetpage: 60*60*1000, // Expire after 1 hour
      default: 5*60*1000,
    },
  }),
})
```
The `assets` cache group is used for the `idFromTicker`, `coins`, `coin`, `coinFromTicker`, and `coinsFromTicker` methods.
The `assetpage` group for `getMarkets`, `getMarketsFromTicker`, `getLinks` and `getLinksFromTicker`.

Additionaly, DefaultCache has a `clear` method that deletes the cached data.
