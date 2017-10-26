const vue = new Vue({
  el: 'main',
  data: {
    user: false,
    companies: {}
  }
})

class Client extends Reconnect {
  connect() {
    this.sock = new WebSocket(this.url)
    this.on('open', () => this.onConnected())
  }

  on(event, fn) {
    return this.sock.addEventListener(event, fn)
  }

  onMessage(e) {
    const data = JSON.parse(e.data)
    switch (data.type) {
      case 'stock':
        vue.companies = data.result
        // console.log(JSON.stringify(data.companies))
        break

      case 'user':
        vue.user = data.result
        break

      default:
        console.log('Unknown response', data)
    }
  }
}

const client = new Client('ws://' + location.host)
