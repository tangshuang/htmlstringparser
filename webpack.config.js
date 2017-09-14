var Bufferify = require('webpack-bufferify')

function UseDefaultExport() {}
UseDefaultExport.prototype.apply = Bufferify.prototype.apply
UseDefaultExport.prototype.process = function(content, file) {
  if (file === 'HTMLStringParser.browser.js') {
    return content + "\r\n" + 'window["HTMLStringParser"] = window["HTMLStringParser"]["default"];'
  }
  if (file === 'VirtualDOM.browser.js') {
    return content + "\r\n" + 'window["VirtualDOM"] = window["VirtualDOM"]["default"];'
  }
}

module.exports = {
  entry: {
    HTMLStringParser: './HTMLStringParser.js',
    VirtualDOM: './VirtualDOM.js',
  },
  output: {
    filename: '[name].browser.js',
    libraryTarget: 'window',
    library: '[name]',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        options: {
          presets: [['es2015', {modules: false}]],
        },
      },
    ],
  },
  plugins: [
    new UseDefaultExport(),
  ],
}
