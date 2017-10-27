const db = require('../data')
const WebSocket = require('ws')
const {isEmpty} = require('underscore')

Object.defineProperties(WebSocket.prototype, {
  session: {
    get() {
      return this.sessions[this.token]
    }
  },

  token: {
    get() {
      return this.request.cookies.token || ''
    }
  },
})

Object.assign(WebSocket.prototype, {
  getProfile(where) {
    if (isEmpty(where)) {
      throw new Error('Empty query')
    }
    // console.error('getProfile', where)
    return db.table('profile')
        .where(where)
        .first()
  },

  async login(params) {
    const user = await this.getProfile(params)
    if (user) {
      user.authorized = Date.now()
      delete user.password
      this.sessions[this.token] = user
      return user
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
  }
})
