var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	res.send('pages/404');
});

module.exports = router;