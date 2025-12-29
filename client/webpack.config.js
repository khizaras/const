const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require("webpack");

const resolvePath = (...segments) => path.resolve(__dirname, ...segments);
require("dotenv").config({ path: resolvePath("..", ".env") });
const babelConfigPath = resolvePath("babel.config.cjs");

module.exports = (env, argv) => {
  const mode = argv?.mode || "development";
  const isDev = mode !== "production";

  return {
    entry: resolvePath("src", "index.jsx"),
    output: {
      path: resolvePath("..", "dist"),
      filename: isDev ? "bundle.js" : "assets/js/[contenthash].js",
      publicPath: "/",
      clean: true,
    },
    mode,
    // Avoid eval-based source maps to satisfy CSP without unsafe-eval
    devtool: isDev ? "source-map" : "source-map",
    devtool: isDev ? "source-map" : "source-map",
    watchOptions: isDev
      ? {
          ignored: /node_modules/,
        }
      : undefined,
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
    optimization: {
      splitChunks: {
        chunks: "all",
      },
      runtimeChunk: "single",
    },
  };
};
