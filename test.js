var test = require('tape')
var diff = require('sorted-diff-stream')
var diffs2string = require('diffs-to-string')
var DATA = require('conflict-spectrum')
var from = require('from2')
var manualMergeStream = require('./')

var TABLES = DATA[0].json

test('manual-merge-stream from sorted-diff-stream', function (t) {
  function keyData (data) {
    var index = 0
    data.map(function (obj) {
      var rObj = {}
      rObj.key = index
      rObj.value = obj
      index++
      return rObj
    })
    return data
  }

  var older = from.obj(keyData(TABLES[1]))
  var newer = from.obj(keyData(TABLES[2]))

  function jsonEquals (a, b, cb) {
    if (JSON.stringify(a) === JSON.stringify(b)) cb(null, true)
    else cb(null, false)
  }

  var diffStream = diff(older, newer, jsonEquals)
  function merge (tables, visual, push, next) {
    console.log(tables)
    console.log(visual)
    t.end()
  }
  var opts = {
    merge: merge
  }
  diffStream.pipe(manualMergeStream(opts))
})

