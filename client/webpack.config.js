const webpack = require('webpack');

module.exports = {
	entry: './src/index.js',
	output: {
		filename: './public/bundle.js'
	},
	module: {
		loaders: [
			{
				test: /\.jsx?/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: ['react', 'es2015']
				}
			},
			{
				test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader'
			}
		]
	},
	plugins: [
	    new webpack.DefinePlugin({
	      // A common mistake is not stringifying the "production" string.
	      'process.env.NODE_ENV': JSON.stringify('production')
	    }),
	    new webpack.optimize.UglifyJsPlugin({
	      compress: {
	        warnings: false
	      }
	    })
	  ]
}