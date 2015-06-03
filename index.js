var inherits = require('inherits')
var Transform = require('stream').Transform
var promptSync = require('prompt-sync')
var debug = require('debug')('manual-merge-stream')

module.exports = ManualMergeStream

inherits(ManualMergeStream, Transform)
function ManualMergeStream (vizFn, merge) {
  if (!(this instanceof ManualMergeStream)) return new ManualMergeStream(vizFn, merge)
  Transform.call(this, {objectMode: true})
  debug('merge fn', merge)
  this.destroyed = false
  this.diff2vis = vizFn || function (changes, cb) {
    cb(changes, changes)
  }
  this.merge = merge || this.cli
}

ManualMergeStream.prototype._transform = function (data, enc, next) {
  var self = this
  debug('merge', data)
  self.diff2vis(data, function (tables, visual) {
    self.merge(tables, visual, self.push.bind(self), next)
  })
}

ManualMergeStream.prototype.cli = function (tables, visual, push, next) {
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

ManualMergeStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  this.err = err
  this.end()
}
