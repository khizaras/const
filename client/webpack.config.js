const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const resolvePath = (...segments) => path.resolve(__dirname, ...segments);
require("dotenv").config({ path: resolvePath("..", ".env") });
const babelConfigPath = resolvePath("babel.config.cjs");

module.exports = ({ mode } = { mode: "development" }) => {
  const isDev = mode !== "production";

  return {
    entry: resolvePath("src", "index.jsx"),
    output: {
      path: resolvePath("dist"),
      filename: isDev ? "bundle.js" : "assets/js/[contenthash].js",
      publicPath: "/",
      clean: true,
    },
    mode: isDev ? "development" : "production",
    devtool: isDev ? "eval-cheap-module-source-map" : "source-map",
    resolve: {
      extensions: [".js", ".jsx"],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              configFile: babelConfigPath,
            },
          },
        },
        {
          test: /\.less$/i,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: { modules: false },
            },
            {
              loader: "less-loader",
              options: {
                lessOptions: {
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpe?g|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/media/[hash][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: resolvePath("public", "index.html"),
      }),
      new webpack.DefinePlugin({
        "process.env.API_BASE_URL": JSON.stringify(
          process.env.API_BASE_URL || "/api"
        ),
        "process.env.DEFAULT_PROJECT_ID": JSON.stringify(
          process.env.DEFAULT_PROJECT_ID || "1"
        ),
      }),
    ],
    devServer: {
      port: 5173,
      historyApiFallback: true,
      hot: true,
      client: {
        overlay: true,
      },
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:5000",
          changeOrigin: true,
        },
      ],
    },
  };
};
