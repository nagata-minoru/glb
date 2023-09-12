module.exports = {
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js']
  },

  mode: "development",
};
