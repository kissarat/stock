const db = require('../data')
const {validateModel} = require('../public/common')
const {isEmpty, pick} = require('underscore')

function invalid(errors) {
  return {
    type: 'error',
    errors
  }
}

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
    // console.log(errors)
    return invalid(errors)
  },

  logout() {
    this.logout()
    return {
      type: 'user',
      result: null
    }
  },

  async user() {
    return {
      type: 'user',
      result: this.isAuthorized
          ? await this.getProfile({id: this.session.id}) : null
    }
  },

  async stock() {
    return {
      type: 'stock',
      result: await this.getStock()
    }
  },

  async wallet() {
    this.checkAuthorized()
    return {
      type: 'wallet',
      result: await db('wallet')
          .where('user', this.session.id)
    }
  },

  buy({data}) {
    this.checkAuthorized()
    let errors = validateModel(data, 'buy')
    if (!isEmpty(errors)) {
      return invalid(errors)
    }
    return new Promise((resolve, reject) => {
      db.transaction(async tx => {
        const items = await this.getStock(tx)
        const item = items[data.code]
        if (!item) {
          tx.rollback()
          return resolve(invalid({code: 'Not found'}))
        }
        if (data.amount > item.amount) {
          tx.rollback()
          return resolve(invalid({amount: item.amount + ' is available'}))
        }
        const user = await this.getProfile({id: this.session.id}, tx)
        const need = item.price * item.amount * 100
        if (user.balance >= need) {
          await db('wallet').insert({
            user: user.id,
            code: data.code,
            amount: item.amount,
            price: Math.ceil(item.price * 100),
            time: Date.now()
          })
          await db('user')
              .where('id', user.id)
              .update({balance: user.balance - need})
          tx.commit()
          return resolve({success: true})
        }
        else {
          tx.rollback()
          return invalid({amount: 'Insufficient funds'})
        }
      })
    })
  },
}
