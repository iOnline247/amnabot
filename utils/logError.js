module.exports = function handleError(err, funcName) {
	console.error('\n:::     ERROR     :::');
	console.error(new Date());
	console.error('function called: ' + funcName);
	if(err) {
		var errorMessage = err.message || err.data || 'Unknown error';
		
		console.error('response status:', err.statusCode);
		console.error('data:', errorMessage);
	}
};