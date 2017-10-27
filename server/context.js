const db = require('../data')
const WebSocket = require('ws')
const {isEmpty} = require('underscore')

Object.defineProperties(WebSocket.prototype, {
  session: {
    get() {
      return this.sessions[this.token]
    }
  },

  isAuthorized: {
    get() {
      const session = this.session
      return session && session.id
    }
  },

  token: {
    get() {
      return this.request.cookies.token || ''
    }
  },
})

Object.assign(WebSocket.prototype, {
  getProfile(where, tx) {
    if (isEmpty(where)) {
      throw new Error('Empty query')
    }
    // console.error('getProfile', where)
    let q = db('user')
    if (tx) {
      q = q.transacting(tx)
    }
    return q.where(where).first()
  },

  async getStock(tx) {
    const stock = this.stockListener.record
    const result = {}
    let q = db('own')
    if (tx) {
      q = q.transacting(tx)
    }
    const own = await q
    for (const item of stock.Items) {
      let amount = item.Unit
      const existing = own.find(c => c.code === item.Code)
      if (existing) {
        amount -= existing.amount / 100
      }
      result[item.Code] = {
        amount,
        price: item.Price
      }
    }
    return result
  },

  async login(params) {
    const user = await this.getProfile(params)
    if (user) {
      const session = {
        id: user.id,
        authorized: Date.now()
      }
      this.sessions[this.token] = session
      return session
    }
    else {
      console.error('User not found', params)
    }
  },

  logout() {
    return delete this.sessions[this.token]
  },

  json(o) {
    this.send(JSON.stringify(o))
  },

  checkAuthorized() {
    if (!this.isAuthorized) {
      throw new Error('Unauthorized')
    }
  }
})
