const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  entry: "./src/index.js",

  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/template.html",
      filename: "index.html",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i, // pour les fichiers CSS
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i, // pour les images
        type: "asset/resource",
      },
      {
        test: /\.html$/i, // pour les fichiers HTML
        use: ["html-loader"],
      },
    ],
  },
  /* devtool: "inline-source-map", // pour le débogage
  devServer: {
    watchFiles: ["./src/template.html"], // surveiller les fichiers HTML
  }, */
};
