var inherits = require('inherits')
var Transform = require('stream').Transform
var promptSync = require('prompt-sync')
var debug = require('debug')('knead-stream')

module.exports = KneadStream

inherits(KneadStream, Transform)
function KneadStream (merge) {
  /*
  transforms to:
    {
      tables: daff tables,
      visual: the terminal visual for that daff
    }
  */
  if (!(this instanceof KneadStream)) return new KneadStream(merge)
  Transform.call(this, {objectMode: true})
  this.destroyed = false
  this.merge = merge || this.cli
}

KneadStream.prototype._transform = function (data, enc, next) {
  var self = this
  debug('merge', data)
  self.merge(data.tables, data.visual, self.push.bind(self), next)
}

KneadStream.prototype.cli = function (tables, visual, push, next) {
  console.log(visual)

  var older = tables[0]
  var newer = tables[1]

  function repl () {
    // TODO: change limit in repl (like git's add -p or e/edit)
    process.stdout.write('Keep this chunk? [y,n,s,q,?] ')
    var val = promptSync()
    if (val === 's' || val === 'skip') {
      return next()
    }
    if (val === 'y' || val === 'yes') {
      for (var i = 0; i < newer.data.length; i++) {
        debug('pushing', newer.data[i])
        push(newer.data[i])
      }
      return next()
    }
    if (val === 'n' || val === 'no') {
      for (var i = 0; i < newer.data.length; i++) {
        debug('pushing', older.data[i])
        push(older.data[i])
      }
      return next()
    }
    if (val === 'q' || val === 'quit') {
      process.exit()
    } else {
      help()
      repl()
    }
  }
  repl()
}

function help () {
  console.log('skip (s), yes (y), no (n), quit (q)')
}

KneadStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  this.err = err
  this.end()
}
