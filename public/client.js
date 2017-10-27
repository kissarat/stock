const vue = new Vue({
  el: 'main',
  data: {
    user: false,
    code: '',
    amount: 1,
    app: appState,
    errors: {},
    login: {
      username: '',
      password: ''
    },
    companies: {},
    wallet: []
  },
  methods: {
    buy(code) {
      if (this.code === code) {
        client.submit(this, 'buy', ['amount', 'code'])
      }
      else {
        this.code = code
      }
    },

    logout() {
      client.request('logout')
    }
  },

  computed: {
  }
})

function newId(n = 2) {
  const strings = []
  for (let i = 0; i < n; i++) {
    strings.push((Math.round(Math.random() * Number.MAX_SAFE_INTEGER)).toString(36))
  }
  return strings.join('')
}

const cookies = parseCookies(document.cookie)

if (!cookies.token) {
  document.cookie = cookieString('token', newId())
}

class Client extends Reconnect {
  constructor(url) {
    super(url)
    this._requests = {}
  }

  connect() {
    this.sock = new WebSocket(this.url)
    this.on('open', () => {
      this.onConnected()
      appState.online = this.isOpen
    })
  }

  request(message) {
    return new Promise((resolve, reject) => {
      if ('string' === typeof message) {
        message = {action: message}
      }
      message.id = newId()
      this._requests[message.id] = {
        resolve, reject(err) {
          console.error(err)
          reject(err)
        }
      }
      this.send(message)
    })
  }

  on(event, fn) {
    return this.sock.addEventListener(event, fn)
  }

  async submit(form, action, fields) {
    const data = _.pick(form, fields)
    const errors = validateModel(data, action)
    if (_.isEmpty(errors)) {
      try {
        await this.request({action, data})
      }
      catch (ex) {
        form.errors = ex.errors || {}
      }
    }
    else {
      form.errors = errors
    }
  }

  onClose() {
    appState.online = this.isOpen
  }

  onMessage(e) {
    const data = JSON.parse(e.data)
    const r = this._requests[data.id]
    if (r) {
      delete this._requests[data.id]
      if ('error' === data.type) {
        r.reject(data)
      }
      else {
        r.resolve(data)
      }
    }
    switch (data.type) {
      case 'stock':
        vue.companies = data.result
        break

      case 'user':
        vue.user = data.result
        if (vue.user) {
          this.request({action: 'stock'})
              .then(() => this.send({action: 'wallet'}))
        }
        break

      case 'wallet':
        vue.wallet = data.result
        break

      default:
        if (!r) {
          console.log('Unknown response', data)
        }
    }
  }
}

const client = new Client('ws://' + location.host)
