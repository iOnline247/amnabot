//get date string for today's date (e.g. '2011-01-01')
module.exports = gregorianDate;

function gregorianDate(d) {
	d = d || new Date();

	function pad( n ) {
		return n < 10 ? '0' + n : n;
	}

	return d.getUTCFullYear() + '-' +
		pad( d.getMonth() +1 ) + '-' +
		pad( d.getDate() );
}