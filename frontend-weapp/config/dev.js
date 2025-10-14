module.exports = {
  env: {
    NODE_ENV: '"development"'
  },
  defineConstants: {},
  // 开发模式下禁用持久化缓存，避免缓存导致的白屏/热更新异常
  cache: {
    enable: false
  },
  // 显式关闭 dev 下的压缩与优化，便于调试
  mini: {
    imageUrlLoaderOption: {
      limit: 1024
    },
    // 开启 dev 下的 JS/CSS 压缩
    terser: { enable: true },
    cssMinimizer: { enable: true }
  },
  h5: {
    devServer: {
      port: 10086,
      host: 'localhost'
    }
  }
}
