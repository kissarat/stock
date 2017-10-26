const fs = require('fs')

const knex = require('knex')({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: __dirname + '/db.sqlite'
  }
})

function loadSQL() {
  const sql = fs.readFileSync(__dirname + '/tables.sql').toString('utf8')
      + fs.readFileSync(__dirname + '/views.sql').toString('utf8')
  return sql.split(/\s*;\s*/).filter(s => s.trim())
}

async function boot() {
  try {
    const tables = await knex.raw("SELECT name FROM sqlite_master WHERE type='table'")
    if (tables.length <= 0) {
      for(const sql of loadSQL()) {
        await knex.raw(sql)
      }
    }
  }
  catch (err) {
    console.error(err)
    process.exit(1)
  }
}

boot()

module.exports = knex
