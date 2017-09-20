Poloniex-api-push
=================

Client to use poloniex api push.
I'm writing after read official [official api](https://poloniex.com/support/api/) documentation autobahn doesnt work.
After reverse poloniex web app, it seem to be not using autobahn and wamp protocole but pur websocket implementation, I created package to wrap this.
It usable for real time data data, more fresh compare to http api.


Features:
- watch multiple pairs in same time
- orderbooks (buy/sell, insert/delete)
- trades
- reconnected automatically

# Install

    npm install --save poloniex-api-push

# Usages:

```js
const PoloniexApiPush = require('poloniex-api-push');
const poloPush = new PoloniexApiPush();

// You need to call before every methods ensure connection is establish

poloPush.init().then(() => {

    //call some methods

});
```

# Methods:

Watch pair:
```js
poloPush.subscribe('BTC_ETH');
```

Unwatch pair:
```js
poloPush.unSubscribe('BTC_ETH');
```

Orderbooks:
```js
poloPush.on('BTC_ETH-orderbook-bids', (orderbookBid) => {

    console.log('BTC_ETH-orderbook-bids', orderbookBid.rate, orderbookBid.amount);

});

poloPush.on('BTC_ETH-orderbook-asks', (orderbookAsk) => {

    console.log('BTC_ETH-orderbook-asks', orderbookAsk.rate, orderbookAsk.amount);

});
```

If amount is set to '0.00000000' this rate is removed, see poloniex offical api.

Trades:
```js
poloPush.on('BTC_ETH-trade', (trade) => {

    console.log('BTC_ETH-trade', trade.type, trade.rate, trade.amount);

  });
```

It's an eventListener, on can add/remove listeners(for orderbook and trades) has well [https://nodejs.org/api/events.html](https://nodejs.org/api/events.html)
