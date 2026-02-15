module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Deshabilitar CSS minification agresiva
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      
      if (miniCssExtractPlugin && miniCssExtractPlugin.options) {
        miniCssExtractPlugin.options.ignoreOrder = true;
      }

      // Configurar CSS minimizer para evitar errores
      const optimization = webpackConfig.optimization || {};
      if (optimization.minimizer) {
        optimization.minimizer = optimization.minimizer.map((minimizer) => {
          if (minimizer.constructor.name === 'CssMinimizerPlugin') {
            minimizer.options = {
              ...minimizer.options,
              parallel: false,
              minimizerOptions: {
                preset: [
                  'default',
                  {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: false,
                  },
                ],
              },
            };
          }
          return minimizer;
        });
      }
      
      return webpackConfig;
    },
  },
  style: {
    postcss: {
      mode: 'file',
    },
  },
};