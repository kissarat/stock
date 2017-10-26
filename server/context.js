const db = require('../data')
const WebSocket = require('ws')

Object.defineProperties(WebSocket.prototype, {
  token: {
    get() {
      return this.request.headers.cookie.token
    }
  },
})

Object.assign(WebSocket.prototype, {
  getProfile(where) {
    if (!where) {
      if (this.request.token && this.request.token.length <= 48) {
        where = {token: this.request.token}
      }
      else {
        return
      }
    }
    return db.table('profile')
        .where(where)
        .first('id', 'surname', 'forename')
  },

  json(o)
  {
    this.send(JSON.stringify(o))
  }
})
