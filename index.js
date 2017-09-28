const WebSocket = require('ws');
const EventEmitter = require('events').EventEmitter;
const markets = require('./markets.json');

class PoloniexApiPush extends EventEmitter {

  constructor(){

    super();
    this.urlPath = 'api2.poloniex.com';
    this.resetTimer = 1500;
    this.ws = null;
    this.subscriptions = [];
    this.connecting = false;

  }

  init(){

    this._ws = new WebSocket(`wss:${this.urlPath}`);
    let resolver = null;
    const p = new Promise(resolve => resolver = resolve);

    this._ws.on('open', () => this.onOpen(resolver) );
    this._ws.on('error', (err) => this.connecting ? null : this.resetWS() );
    this._ws.on('close', () => this.connecting ? null : this.resetWS() );

    return p;

  }

  resetWS(){

    this.connecting = true;

    if(this._ws instanceof WebSocket && (this._ws.readyState !== this._ws.CLOSED || this._ws.readyState !== this._ws.CLOSING) ){

      if(this._ws instanceof WebSocket && this._ws.readyState === this._ws.OPEN){

        const subscriptions = Object.assign([], this.subscriptions);
        subscriptions.forEach(pair => this.unSubscribe(pair) );
        this.subscriptions = subscriptions;

      }

      this._ws.close();
      this._ws.terminate();

    }

    setTimeout( () => {

      this.init().then(() => {

        const subscriptions = Object.assign([], this.subscriptions);
        this.subscriptions = [];
        subscriptions.forEach(channel => this.subscribe(channel) );

      }).catch(err => console.error(err) );

      this.connecting = false;

    }, this.resetTimer);

  }

  onOpen(cb){

    if(this.heartbeat){

      clearInterval(this.heartbeat);

    }

    this.heartbeat = setInterval( () => {

      try{

        this._ws.send('.');

      } catch(err){

        clearTimeout(this.heartbeat);
        this.resetWS();

      }

    }, 60 * 1000);

    this.dispatchMessages();
    cb();

  }

  dispatchMessages(){

    this._ws.on('message',  (mess) => {

      if(mess.length === 0){

        return;

      }

      const data = JSON.parse(mess);
      const seq = data[1];

      if(typeof seq === 'number'){

        if(!Array.isArray(data[2]) ){

          return console.error(`Unknown message: ${data}`);

        }

        const market = markets.byID[data[0]];

        data[2].forEach( (entry) => {

          switch(entry[0]){

            case 'i':

              Object.keys(entry[1].orderBook[0]).forEach(rate => this.emit(`${market.currencyPair}-orderbook-asks`, {rate, amount: entry[1].orderBook[0][rate]}) );
              Object.keys(entry[1].orderBook[1]).forEach(rate => this.emit(`${market.currencyPair}-orderbook-bids`, {rate, amount: entry[1].orderBook[1][rate]}) );
              break;

            case 'o':

              this.emit(`${market.currencyPair}-orderbook-${entry[1] === 1 ? 'bids' : 'asks'}`, {
                rate: entry[2],
                amount: entry[3]
              });
              break;

            case 't':

              this.emit(`${market.currencyPair}-trade`, {
                id: entry[1],
                type: entry[2] === 1 ? 'buy' : 'sell',
                rate: entry[3],
                amount: entry[4]
              });
              break;

            default:
              console.error(`Unknown message: ${data}`);
              break;
          }

        });

      }

    });

  }


  subscribe(pair){

    if(!this.subscriptions.find(subPair => subPair === pair) ){

      this.subscriptions.push(pair);
      this.send('subscribe', pair);

    }

  }

  unSubscribe(pair){

    this.subscriptions = this.subscriptions.filter(channel => channel !== pair);

    this.send('unsubscribe', pair);

  }

  send(cmd, channel){

    if(this._ws instanceof WebSocket && this._ws.readyState === this._ws.OPEN){

      return this._ws.send(JSON.stringify({command: cmd, channel }) );

    }

    throw new Error('Not connected');

  }

}

module.exports = PoloniexApiPush;
