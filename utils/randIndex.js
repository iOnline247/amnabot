var randIndex = function( arr ) {
	var index = Math.floor( arr.length * Math.random() );
	return arr[ index ];
};

module.exports = randIndex;