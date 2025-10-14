module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {},
  mini: {
    optimizeMainPackage: {
      enable: true
    },
    imageUrlLoaderOption: {
      limit: 512
    },
    terser: {
      enable: true,
      config: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    cssMinimizer: {
      enable: true,
      config: {}
    },
    // 保守模式：固定公共包切分，避免个别机型白屏
    commonChunks: ['runtime', 'vendors', 'taro', 'common']
  },
  h5: {
    /**
     * WebpackChain 插件配置
     * @docs https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain, webpack) {}
    /**
     * Webpack 插件配置
     * @docs https://webpack.js.org/concepts/plugins/
     */
    // webpack: {}
  }
}
