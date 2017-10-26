const db = require('../data')

module.exports = {
  async user() {
    this.json({
      type: 'user',
      result: await this.getProfile()
    })
  },

  async stock() {
    const stock = this.stockListener.record
    const result = {}
    const own = await db.table('own')
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
    this.json({
      type: 'stock',
      result
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
