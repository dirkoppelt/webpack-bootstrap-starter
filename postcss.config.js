module.exports = (ctx) => ({
	plugins: [
    require('precss'),
		require('autoprefixer')(ctx.plugin),
    require('postcss-flexbugs-fixes'),
	]
});
