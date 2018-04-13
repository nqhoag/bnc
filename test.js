const binance = require('node-binance-api');
const fs = require('fs');
var logFile = fs.createWriteStream('/var/www/html/index.html', { flags: 'a' });
// const
binance.options({
  'APIKEY':'ydkBJ2gP4nIoZtzILlPdUUWDyU72SDCEQl8uWzU9kPyymEnblvGs0PIHmYQqiWwh',
  'APISECRET':'c2riFb8tYMGwYrq7G59ax1mVKzCKOokoP8btpwCn3JVtrfZSlr8pmdo4mlmSBxuN',
  // 'test':true
});
let currentTime = null;
let buyHistory = [];

setInterval(function(){
        let sub = binance.websockets.subscriptions();
        binance.prices((error, ticker) => {
            for (var coinName in ticker) {
                binance.candlesticks(coinName, "1d", (error, ticks, symbol) => {
//                    console.log(symbol);
                    if (ticks.length > 1 && ! sub[symbol.toLowerCase()+'@kline_1d']) {
                        main(symbol);
                    }
                }, {limit: 2});
            }
        //   console.log("prices()", ticker);
        //   console.log("Price of BTC: ", ticker.BTCUSDT);
        });
        
}, 10000);

function main(coinName){
        binance.websockets.candlesticks([coinName], "1d", (candlesticks) => {
            let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
            let { t:time, o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
            
            let coin_name = symbol;
            let main_coin = coin_name.slice(-3);
            let main_price = 0;
            let percentChange = (close - open)/open*100;
            
            
            if (main_coin == "BTC") {
                main_price = 0.0015;
                 // Buy 0.002 BTC
            } else if (main_coin == "ETH") {
                main_price = 0.025;
            } else if (main_coin == "BNB") {
                main_price = 1.5;
            } else {
                return;
            }
            if (main_price != 0) {
                let eventTime = new Date(time);
                let day = eventTime.getDate()
                let month = eventTime.getMonth() + 1
                let year = eventTime.getFullYear()
                let eventDate = year + "/" + month + "/" + day;
                if (currentTime < eventDate || currentTime == null) {
                    currentTime = eventDate;
                    buyHistory = [];
                    logFile.write('<br/>[INFO] ' + "Start for " + eventDate);
                }
                
                let currentType = 0;
                if (buyHistory[coin_name] !== undefined) {
                    currentType = buyHistory[coin_name];
                }
		console.log(coin_name, " ", percentChange, "%");                
                check_decrease(coin_name, - percentChange, currentType);
                
                if ( - percentChange > 99 && currentType < 99) {
                    let price = open - (99/100*open);
                    let quantity = parseInt(main_price/price);
                    buy(coin_name, quantity, price, 99);
                    return;
                }
               if ( - percentChange > 90 && currentType < 90) {
                       let price = open - (90/100*open);
                       let quantity = parseInt(main_price/price);
                       buy(coin_name, quantity, price, 90);
                       return;
               }
               if ( - percentChange > 50 && currentType < 50) {
                       let price = open - (50/100*open);
                       let quantity = parseInt(main_price/price);
                       buy(coin_name, quantity, price, 50);
                       return;
               }
            }
        });
    
}
function buy(coin_name, quantity , price, type)
{
        binance.buy(coin_name, quantity, price, {type:'LIMIT'}, (error, response) => {
                if (error) {
                        logFile.write('<br/>[ERROR] ' + error);
                }
                buyHistory[coin_name] = type;
                logFile.write('<br/>[INFO] ' + "Bought " + coin_name + " at " + type + "%.");
        });
}

function check_decrease(coin_name, change, currentType)
{
        for( let percent = 99; percent >= 9; percent = percent - 10) {
                if (change > percent && currentType < percent) {
                        // let price = open - (percent/100*open);
                        // let quantity = parseInt(main_price/price);
                        // buy(coin_name, quantity, percent);
                        logFile.write('<br/>[INFO] ' + coin_name + " has decrease > " + percent + "%");
                        // console.log("Notice: ", coin_name, " has decrease > ", change, "%")
                        buyHistory[coin_name] = percent;
                        return;
                }
        }
}

