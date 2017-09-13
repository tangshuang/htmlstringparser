var Bufferify = require('webpack-bufferify')

function UseDefaultExport() {}
UseDefaultExport.prototype.apply = Bufferify.prototype.apply
UseDefaultExport.prototype.process = function(content) {
    return content + "\r\n" + 'window.HTMLStringParser = window.HTMLStringParser.default;'
}

module.exports = {
  entry: './HTMLStringParser.js',
  output: {
    filename: 'HTMLStringParser.browser.js',
    libraryTarget: 'window',
    library: 'HTMLStringParser',
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
