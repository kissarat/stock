const express = require('express')
const WebSocket = require('ws')
const {Reconnect, parseCookies} = require('../public/common')
const actions = require('./actions')
const db = require('../data')
require('./context')

const port = 3000

const app = express()

const server = app.listen(port, function () {
  console.log(new Date().toLocaleString() + ' at ' + port)
})

class StockListener extends Reconnect {
  constructor(url) {
    super(url)
  }

  connect() {
    this.sock = new WebSocket(this.url)
    this.on('open', () => this.onConnected())
  }

  on(event, fn) {
    this.sock.on(event, fn)
  }

  async onMessage(data) {
    const record = JSON.parse(data)
    record.type = 'stock'
    record.time = new Date(record.PublicationDate).getTime()
    this.record = record
    for (const sock of wss.clients) {
      await actions.stock.call(sock)
    }
  }
}

const stockListener = new StockListener('ws://webtask.future-processing.com:8068/ws/stocks?format=json')

const wss = new WebSocket.Server({server});
wss.on('connection', async function (sock, req) {
  try {
    req.cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {}
    sock.request = req
    sock.stockListener = stockListener
    await actions.user.call(sock)
    await actions.stock.call(sock)
    sock.on('message', async function (data) {
      try {
        data = JSON.parse(data)
        const action = (data.action && actions[data.action]) || actions.invoke
        await action.call(sock, data)
      }
      catch (ex) {
        console.error(ex)
      }
    })
  }
  catch (ex) {
    console.error(ex)
  }
})

app.use(express.static(__dirname + '/../public'))
