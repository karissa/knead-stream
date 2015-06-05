# manual-merge-stream

Use the cli to merge a diff stream. See use in [knead](karissa/knead)

[![NPM](https://nodei.co/npm/manual-merge-stream.png)](https://nodei.co/npm/manual-merge-stream/)

You'll want to pass your diff stream through a batch function first, because otherwise the user might be overwhelmed with console output.

```js
var Batcher = require('byte-stream')
var manualMergeStream = require('manual-merge-stream')
var diffs2string = require('diffs-to-string')

var limit = 5
var batchStream = Batcher(limit)
var opts = {
  vizFn: function (diff, cb) {
    cb(changes, diffs2string(diff))
  }
}

diffStream.pipe(batchStream).pipe(manualMergeStream(opts))
```

The user is presented with a prompt for each page of the stream.

### Options
`vizFn` (optional): which viz function to use. uses [diffs-to-string](karissa/diffs-to-string) by default.
`merge` (optional): if you want to use a custom cli function. mostly used for testing.

Example:
```
row 1
    country: germany
  + capital: berlin
  + code: de
row 2
    country: ireland
    capital: dublin
  + code: ie
row 3
  - country: france
    capital: paris
  + code: fr
row 4
    country: spain
  ? capital: madrid -> barcelona
  + code: es

Keep this chunk? [y/n/s/q/?]:
```

At each page, the user is presented with a prompt and can enter one of the following choices:

  `yes`: Will merge the right diff over the left diff

  `no`: Will ignore the right diff

  `skip`: Will skip this chunk and write neither

  `quit`: Will abort, not writing everything

  `?`: Will give more detailed instructions


### TODO
Add options:
  `yy`: yes the rest

  `nn`: no to the rest

  `ss`: skip the rest


