module.exports = {
  entry: "./lib/index",
  output: {
    path: __dirname,
    filename: "socket.io.js"
  },
  module: {
    noParse: ['ws']
  },
  externals: ['ws']
}
