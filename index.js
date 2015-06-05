var inherits = require('inherits')
var Transform = require('stream').Transform
var prompt = require('cli-prompt')
var debug = require('debug')('manual-merge-stream')
var diffs2string = require('diffs-to-string')

module.exports = ManualMergeStream

inherits(ManualMergeStream, Transform)
function ManualMergeStream (opts) {
  if (!(this instanceof ManualMergeStream)) return new ManualMergeStream(opts)
  Transform.call(this, {objectMode: true})
  debug('merge fn', opts.merge)
  this.destroyed = false
  this.diff2vis = opts.vizFn || function (changes, cb) {
    cb(changes, diffs2string(changes))
  }
  this.merge = opts.merge || this.cli
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
    prompt('Keep this chunk? [y,n,s,q,?] ', function (val) {
      debug('val', val)
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
    })
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
