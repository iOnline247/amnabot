module.exports = log;

function log() {
	var args = [];

	for(var i = 0; i<arguments.length; i++){
		args.push(arguments[i]);
	}

	var timeStampedArgs = ['\n::: ' + new Date() + ' :::\n'].concat(args);
	console.log.apply(console, timeStampedArgs);
}