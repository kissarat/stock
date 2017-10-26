const child_process = require('child_process')
const fs = require('fs')
require('colors')

let child

function run() {
  const start = Date.now()
  child = child_process.spawn(
      'node',
      [__dirname + '/index.js'],
      {
        stdio: 'inherit',
        cwd: __dirname
      }
  )

  child.on('close', function () {
    const delta = start - Date.now() + 3000
    setTimeout(run, delta > 0 ? delta : 0)
  })
}

fs.watch(__dirname, function (eventType, filename) {
  if (!/___jb_(tmp|old)___$/.test(filename)) {
    console.log(filename.green)
    child.kill('SIGINT')
  }
})

run()
