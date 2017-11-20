# CoinMarketCap extended API

API access to CoinMarketCap website functionality.

Uses a local cache to avoid re-fetching coin info too frequently.

## Installation

```sh
npm install https://github.com/lleaff/coinmarketcap-extended-api.git
```

## Usage

```javascript
import * as CoinMarketCap from 'coinmarketcap-extended-api'

CoinMarketCap.getMarketsFromTicker('ETH')
```

## API

The cache is managed automatically (invalidated after 6 hours), and can also be refreshed manually by calling `refreshCache`.

`idFromTicker(ticker): id`  

`getMarkets(id): [Market]`  

`getMarketsFromTicker(ticker): [Market] `  

`coinFromTicker(ticker): Coin`  

`refreshCache()`  
