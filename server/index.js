const express = require('express')
const WebSocket = require('ws')
const {Reconnect, parseCookies} = require('../public/common')
const actions = require('./actions')
const db = require('../data')
const fs = require('fs')
require('./context')

const port = 3000

const app = express()

const server = app.listen(port, function () {
  console.log(new Date().toLocaleString() + ' at ' + port)
})

class StockListener extends Reconnect {
  constructor(url) {
    super(url)
    this.record = {
      PublicationDate: "1970-01-01T00:00:00.000Z",
      Items: []
    }
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

let sessions = {}
const SESSION_FILE = '/tmp/stock-sessions.json'
try {
  sessions = JSON.parse(fs.readFileSync(SESSION_FILE))
  fs.unlinkSync(SESSION_FILE)
}
catch (ex) {

}

process.on('SIGINT', function () {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions))
  }
  catch (ex) {
    console.error('Cannot save sessions', ex)
  }
  process.exit()
})

const stockListener = new StockListener('ws://webtask.future-processing.com:8068/ws/stocks?format=json')

const wss = new WebSocket.Server({server});
wss.on('connection', async function (sock, req) {
  async function callAction(actionName, message = {}) {
    const action = actions[actionName]
    let response
    if ('function' === typeof action) {
      response = await action.call(sock, message)
      response.id = message.id
    }
    else {
      response = {
        type: 'error',
        message: `Action ${actionName} not found`
      }
    }
    return response
  }

  try {
    req.cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {}
    sock.request = req
    sock.stockListener = stockListener
    sock.sessions = sessions
    sock.json(await callAction('user'))
    sock.on('message', async function (string) {
      let response
      try {
        const message = JSON.parse(string)
        response = await callAction(message.action, message)
      }
      catch (ex) {
        console.error(ex)
        response = {
          type: 'error',
          message: ex.message
        }
      }
      sock.json(response)
    })
  }
  catch (ex) {
    console.error(ex)
  }
})

app.use(express.static(__dirname + '/../public'))

setInterval(function () {
  for(const id in sessions) {
    if (Date.now() - sessions[id].authorized > 3600 * 1000) {
      delete sessions[id]
    }
  }
}, 60 * 1000)
