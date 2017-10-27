const _ = 'undefined' === typeof window
    ? require('underscore')
    : window._

const validators = {
  required(key) {
    if (_.isEmpty(this[key])) {
      return 'Is required'
    }
  },

  regex(key, regex) {
    if (!regex.test(this[key])) {
      return 'Is invalid'
    }
  },

  trim(key) {
    if ('string' === typeof this[key]) {
      this[key] = this[key].trim()
    }
  }
}

function validateModel(o, rules) {
  if ('string' === typeof rules) {
    const ruleSet = validations[rules]
    if (ruleSet) {
      rules = ruleSet
    }
    else {
      throw new Error(`Rules for model ${rules} not found`)
    }
  }
  const errors = {}
  for (const rule of rules) {
    if ('function' === typeof rule) {
      Object.assign(errors, rule.call(o))
    }
    else {
      const validate = validators[rule[1]]
      for (const key of (rule[0] instanceof Array ? rule[0] : [rule[0]])) {
        const message = validate.call(o, key, ...rule.slice(2))
        if (message) {
          errors[key] = message
        }
      }
    }
    if (!_.isEmpty(errors)) {
      return errors
    }
  }
  return errors
}

const validations = {
  auth: [
    [['id', 'password'], 'required'],
    [['id', 'password'], 'trim'],
    ['id', 'regex', /^[\w_]+$/],
  ]
}

function parseCookies(string, cookies = {}) {
  for (const cookie of string.split('; ')) {
    const kv = cookie.split('=')
    cookies[kv[0]] = kv[1]
  }
  return cookies
}

function cookieString(key, value) {
  return key + `=${value}; path=/; max-age=` + 3600 * 24 * 365
}

class Reconnect {
  constructor(url) {
    this.url = url
    this.connect()
  }

  onConnected() {
    this.on('close', () => {
      this.sock = null
      setTimeout(() => this.connect(), 600)
    })
    this.on('message', e => this.onMessage && this.onMessage(e))
    this.on('error', e => this.onConnectionError && this.onConnectionError(e))
  }

  send(o) {
    this.sock.send(JSON.stringify(o))
  }
}

if ('undefined' !== typeof module) {
  module.exports = {validators, validateModel, validations, Reconnect, parseCookies, cookieString}
}
