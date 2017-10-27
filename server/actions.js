const db = require('../data')
const {validateModel} = require('../public/common')
const {isEmpty, pick} = require('underscore')

module.exports = {
  async auth({data}) {
    let errors = validateModel(data, 'auth')
    if (isEmpty(errors)) {
      const user = await this.getProfile({id: data.id})
      if (data.signup) {
        if (user) {
          errors = {id: 'User already registered'}
        }
        else {
          data = pick(data, 'id', 'password')
          await db.table('user').insert(data)
          return {
            type: 'user',
            result: await this.login({id: data.id})
          }
        }
      }
      else if (user) {
        if (data.password === user.password) {
          return {
            type: 'user',
            result: await this.login({id: data.id})
          }
        }
        else {
          errors = {password: 'Wrong password'}
        }
      }
      else {
        errors = {id: 'User not found'}
      }
    }
    console.log(errors)
    return {
      type: 'error',
      errors
    }
  },

  logout() {
    this.logout()
    return {
      type: 'user',
      result: null
    }
  },

  user() {
    return {
      type: 'user',
      result: this.session
    }
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
    return {
      type: 'stock',
      result
    }
  },

  invoke(action) {
    this.json({
      type: 'error',
      message: 'Unknown action',
      action
    })
  }
}
