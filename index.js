var fs = require('fs')
var path = require('path')
var inherits = require('inherits')
var Transform = require('stream').Transform
var prompt = require('cli-prompt')
var debug = require('debug')('manual-merge-stream')
var diffs2string = require('diffs-to-string')

module.exports = ManualMergeStream

inherits(ManualMergeStream, Transform)
function ManualMergeStream (opts) {
  if (!(this instanceof ManualMergeStream)) return new ManualMergeStream(opts)
  if (!opts) opts = {}

  Transform.call(this, {objectMode: true})
  debug('merge fn', opts.merge)
  this.destroyed = false
  this.diff2vis = opts.vizFn || diffs2string
  this.merge = opts.merge || this.cli
  this.stickyBit = false
}

ManualMergeStream.prototype._transform = function (data, enc, next) {
  var self = this
  debug('merge', data)
  var visual = self.diff2vis(data)
  self.merge(data, visual, self.push.bind(self), next)
}

ManualMergeStream.prototype.cli = function (diff, visual, push, next) {
  var self = this

  var older = diff.map(function (d) { return d[0] })
  var newer = diff.map(function (d) { return d[1] })

  debug('older', older)
  debug('newer', newer)

  function pushPage (page) {
    debug('pushing page', page)

    for (var i = 0; i < page.length; i++) {
      debug('pushing', page[i])
      push(page[i])
    }
  }

  function repl () {
    if (self.stickyBit) {
      if (self.stickyBit === 'y') {
        pushPage(newer)
        return next()
      }
      else {
        pushPage(older)
        return next()
      }
    }
    console.log(visual)
    prompt('Keep this chunk? [y,n,s,q,?] ', getInput)
  }
  repl()

  function getInput (val) {
    debug('val', val)
    if (val === 's' || val === 'skip') {
      return next()
    }

    if (val === 'y' || val === 'yes') {
      pushPage(newer)
      return next()
    }
    if (val === 'n' || val === 'no') {
      pushPage(older)
      return next()
    }

    if (val === 'yy') {
      return confirm('say y to the rest of the rows.', function (yes) {
        if (yes) {
          self.stickyBit = 'y'
          repl()
        }
        else repl()
      })
    }

    if (val === 'nn') {
      return confirm('say n to the rest of the rows.', function (yes) {
        if (yes) {
          self.stickyBit = 'n'
          repl()
        }
        else repl()
      })
    }

    if (val === 'q' || val === 'quit') {
      process.exit()
    } else {
      help()
      repl()
    }
  }

}

function confirm (msg, cb) {
  prompt('This will ' + msg + ' Are you sure? (y/n):', function (subval) {
    if (subval === 'y') {
      cb(true)
    }
    else {
      cb(false)
    }
  })
}

function help () {
  console.log(fs.readFileSync(path.join(__dirname, 'usage.txt')).toString())
}

ManualMergeStream.prototype.destroy = function (err) {
  if (this.destroyed) return
  this.destroyed = true
  this.err = err
  this.end()
}
