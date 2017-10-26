module.exports = {
  async user() {
    this.json({
      type: 'user',
      result: await this.getProfile()
    })
  },

  stock() {
    this.json({
      type: 'stock',
      result: this.stockListener.record
    })
  },

  invoke(action) {
    this.json({
      type: 'error',
      message: 'Unknown action',
      action
    })
  }
}
