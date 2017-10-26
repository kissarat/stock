const data = {
  user: {
    forename: '',
    surname: ''
  },
  companies: {}
}

new Vue({
  el: 'main',
  data
})

class Client extends Reconnect {
  connect() {
    this.sock = new WebSocket(this.url)
    this.on('open', () => this.onConnected())
  }

  on(event, fn) {
    return this.sock.addEventListener(event, fn)
  }
}

const client = new Client('ws://' + location.host)
