module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // DESHABILITAR CSS Minimizer completamente
      const optimization = webpackConfig.optimization || {};
      
      if (optimization.minimizer) {
        // Filtrar el CSS Minimizer para removerlo
        optimization.minimizer = optimization.minimizer.filter(
          (minimizer) => minimizer.constructor.name !== 'CssMinimizerPlugin'
        );
      }

      // Ignorar orden de CSS para evitar warnings
      const miniCssExtractPlugin = webpackConfig.plugins.find(
        (plugin) => plugin.constructor.name === 'MiniCssExtractPlugin'
      );
      
      if (miniCssExtractPlugin && miniCssExtractPlugin.options) {
        miniCssExtractPlugin.options.ignoreOrder = true;
      }
      
      return webpackConfig;
    },
  },
};