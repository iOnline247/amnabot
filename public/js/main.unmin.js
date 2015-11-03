(function($, window) {
	function setCSRFToken(securityToken) {
		jQuery.ajaxPrefilter(function(options, _, xhr) {
		if ( !xhr.crossDomain ) 
		xhr.setRequestHeader('X-CSRF-Token', securityToken);
		});
	}

	setCSRFToken($('input[name="_csrf"]').val());

	var routes = ['/hashtags'];
	var apiCalls = routes.map(function(route) {
		return $.getJSON(route);
	});

	$.when.apply($, apiCalls)
	.then(function(hashtags, rtUsers) {
		hashtags = hashtags.map(function(hashtag, idx) {
			hashtag.idx = idx;
			return hashtagTemplate(hashtag);
		});

		if(hashtags.length) {
			$('.hashtags').find('tbody').html(hashtags);
		}
	}).fail(function() {
		debugger;
		console.dir(arguments);
	});


/*

	
	var CSRF_HEADER = 'X-CSRF-Token';

	var setCSRFToken = function(securityToken) {
	jQuery.ajaxPrefilter(function(options, _, xhr) {
	if ( !xhr.crossDomain ) 
	xhr.setRequestHeader(CSRF_HEADER, securityToken);
	});
	};

	setCSRFToken($('input[name="_csrf"]').val());

	// CREATE
	$.post('/hashtags', {name:'NFL', frequency: '0.1'}).always(function() {  });

	// READ
	$.getJSON('/hashtags/4')

	// UPDATE
	$.ajax({
		url: '/hashtags/4',
		type: 'PUT',
		data: { 
			name: 'test' 
		}
	});

	// DELETE
	$.ajax({
	    url: '/hashtags/5',
	    type: 'DELETE',
	    success: $.noop,
	    error: $.noop
	});


*/
	// Templates
	function hashtagTemplate(hashtag) {
		return '<tr data-idx="' + hashtag.idx + '" data-name="' + hashtag.name + '" data-frequency="' + 
				hashtag.frequency + '">' +
					'<td>' +
						'<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>&nbsp;&nbsp;' +
						'&nbsp;&nbsp;<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
					'<td>' + 
						'<a href="https://twitter.com/search?q=%23' + hashtag.name +
						'" target="_blank">#' + hashtag.name + '</a>' +
					'</td>' +
					'<td>' +
						'<span>' + hashtag.frequency + '</span>' +
					'</td>' +
				'</tr>';	
	}

	// Events
	$('.hashtags').on('click', '.glyphicon-pencil, .glyphicon-remove', function(event) {
		var isEdit = this.classList.contains('glyphicon-pencil');
		var $this = $(this).closest('tr');
		var id = $this.data('idx');

		if(isEdit) {
			$('.hashtag-form').click();	
		} else {					
			// TODO:
			// Add Undo notification, then fire AJAX if 
			// the touch/click was valid.
			$.ajax({
				url: '/hashtags/' + id,
				type: 'DELETE'
			}).then(function(data) {
				$this.addClass('delete')
				.fadeOut(1000, function() {

					$this.remove();
					$this = null;
				});
			});
		}
	});

	var $hashtagModal = $('#hashtag-modal');

	$hashtagModal.on('shown.bs.modal', function () {
		// Adds focus to hashtag input.
		$('#basic-addon1').next().focus();
	});
}(jQuery));