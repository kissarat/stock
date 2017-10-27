const appState = {
  online: false
}

Vue.component('auth', {
  template: document.getElementById('auth-view').innerHTML,
  data() {
    return {
      signup: false,
      id: '',
      password: '',
      errors: {}
    }
  },

  methods: {
    async submit() {
      client.submit(this, 'auth', ['id', 'password', 'signup'])
    }
  }
})
