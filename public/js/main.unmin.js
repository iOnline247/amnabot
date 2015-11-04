(function($, window) {
	function setCSRFToken(securityToken) {
		jQuery.ajaxPrefilter(function(options, _, xhr) {
			if ( !xhr.crossDomain ) {
				xhr.setRequestHeader('X-CSRF-Token', securityToken);	
			}
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


// $('.onoffswitch').css({ opacity: 0.0 }).removeClass('hidden').animate({ opacity: 1.0 }, 2000);

/*
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
		var frequency = hashtag.frequency * 100;
		return '<tr>' +
					'<td>' +
						'<button type="button" class="hidden" data-toggle="modal"' +
						' data-target="#hashtag-modal" data-idx="' + hashtag.idx + '" ' + 
						'data-name="' + hashtag.name + '" data-frequency="' + frequency + 
						'" data-form-title="Edit Search Term">Edit Hashtag</button>' +
						'<span class="glyphicon glyphicon-pencil" aria-hidden="true"></span>&nbsp;&nbsp;' +
						'&nbsp;&nbsp;<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>' +
					'<td>' + 
						'<a href="https://twitter.com/search?q=' + encodeURIComponent(hashtag.name) +
						'" target="_blank">' + hashtag.name + '</a>' +
					'</td>' +
					'<td>' +
						'<span>' + frequency + '%</span>' +
					'</td>' +
				'</tr>';	
	}

	// Events
	// Validation of forms.
	$('.modal').on('input propertychange', '.js-invalid', function(event) {
		var $this = $(this);
		var value = $this.val();

		if(value !== '#' || value !== '') {
			$this.removeClass('js-invalid');
		}
	});

	$('.hashtags').on('click', '.glyphicon-pencil, .glyphicon-remove', function(event) {
		var isEdit = this.classList.contains('glyphicon-pencil');
		var $this = $(this).siblings('button');
		var $tr = $this.closest('tr');
		var id = $this.data('idx');

		if(isEdit) {
			$this.click();
		} else {					
			// TODO:
			// Add Undo notification, then fire AJAX if 
			// the touch/click was valid.
			$.ajax({
				url: '/hashtags/' + id,
				type: 'DELETE'
			}).then(function(data) {
				console.dir(data);
				$tr.fadeOut(1000);
			});
		}
	});

	var $hashtagModal = $('#hashtag-modal');
	var $rtToggle = $('#rt-tweets-toggle');

	$hashtagModal.on('show.bs.modal', function (event) {
		var $button = $(event.relatedTarget); // Button that triggered the modal
		var $modal = $(this);
		var $submit = $modal.find('.btn-primary');
		var $hashtag = $modal.find('[placeholder="Search Term"]');
		var $frequency = $modal.find('[placeholder="Frequency"]');
		var $idx = $modal.find('.js-index');
		var data = $button.data();

		// If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
		// Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
		
		$modal.find('.modal-title').text(data.formTitle);
		$hashtag.val(data.name);
		$frequency.val(data.frequency);
		$idx.val(data.idx);
		$submit.on('click', function(event) {
			var invalid = false;
			var hashtagVal = $hashtag.val();
			var frequencyVal = $frequency.val();
			var idxVal = $idx.val();
			var data = {
				name: hashtagVal, 
				frequency: frequencyVal / 100
			};
			var dfd;

			if(hashtagVal === '#' || hashtagVal === '') {
				$hashtag.addClass('js-invalid');
				invalid = true;
			}

			if(frequencyVal === '') {
				$frequency.addClass('js-invalid');
				invalid = true;
			}

			if(invalid) {
				return;
			}

			if(idxVal === '') {
				// New search term.
				dfd = $.post('/hashtags', data);
			} else {
				// Edit search term.
				dfd = $.ajax({
					url: '/hashtags/' + idxVal,
					type: 'PUT',
					data: data
				});
			}

			dfd.then(function(hashtag) {
				var $hashtags = $('.hashtags');
				var $existingSearchTerm = $hashtags.find('button[data-idx="' + hashtag.idx + '"]');
				var html = hashtagTemplate(hashtag)

				if($existingSearchTerm.length) {
					$existingSearchTerm.closest('tr').replaceWith(html);
				} else {
					$hashtags.append(html);
				}

				$hashtags.find('button[data-idx="' + hashtag.idx + '"]')
					.closest('tr')
					.css({ opacity: 0.0 })
					.animate({ opacity: 1.0 }, 2000);
			}).fail(function(response) {
				response.status;
				response.statusText;
				response.responseText;
				console.dir(arguments);
				debugger;
			}).always(function() {
				$modal.modal('hide');
				$submit.off(event);

				$button = null;
				$modal = null;
				$submit = null;
				$hashtag = null;
				$frequency = null;
			});
		});
	});

	$hashtagModal.on('shown.bs.modal', function() {
		// Adds focus to hashtag input.
		$('#basic-addon1').next().focus();
	});
	$hashtagModal.on('hidden.bs.modal', function() {
		var $modal = $(this);

		$modal.find('.js-invalid').removeClass('js-invalid');
	});
}(jQuery));