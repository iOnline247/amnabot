(function($, window) {
	function setCSRFToken(securityToken) {
		jQuery.ajaxPrefilter(function(options, _, xhr) {
			if ( !xhr.crossDomain ) {
				xhr.setRequestHeader('X-CSRF-Token', securityToken);
			}
		});
	}

	setCSRFToken($('input[name="_csrf"]').val());

	var routes = ['/hashtags', '/memes', '/botactions'];
	var apiCalls = routes.map(function(route) {
		return $.getJSON(route);
	});

	// RegExps
	var risBlank = /^\s$|^$/;
	// starts with # followed by a letter. Optional numbers/letters thereafter.
	var risValidHashtag = /^#[a-z]{1}(?:[a-z0-9]{1,})?$/i;
	// Optional protocol, verifies the imgur url is valid (mostly).
	var rimgurUrl = /^(?:https?:)?\/\/i\.imgur\.com\/[a-z0-9]{1,}/i;

	// Animation timings.
	var timings = {
		fadeIn: 600,
		fadeOut: 800,
		"delete": 4000,
		notification: 300,
		opacity: 1500
	}

	// $els
	var $hashtags = $('.hashtags');
	var $memes = $('.memes');
	var $hashtagModal = $('#hashtag-modal');
	var $modals = $('.modal');
	var $memesModal = $('#memes-modal');
	var $activeToggles = $('.active-toggle');

	// Fire when ready!
	$.when.apply($, apiCalls)
	.then(function(hashtags, memes, botActions) {
		hashtags = hashtags[0].map(function(hashtag) {
			return hashtagTemplate(hashtag);
		});
		memes = memes[0].map(function(meme) {
			meme.url = getThumbnailUrl(meme.url, 'min');

			return memeTemplate(meme);
		});

		// Toggles.
		botActions = botActions[0];
		Object.keys(botActions).forEach(function(prop) {
			$('#' + prop + '-toggle')
				.prop('checked', botActions[prop].activated)
				.parent('.onoffswitch')
				.css({opacity: 0})
				.removeClass('js-vizi-hidden')
				.animate({ opacity: 1 }, timings.opacity);
		});

		// Update DOM!
		if(hashtags.length) {
			$hashtags.find('tbody').html(hashtags.join(''));
		} else {
			// TODO:
			// Remove existing "no items" template
			// add twirly whirly.
			// Add no items template here.
		}

		if(memes.length) {
			$memes.html(memes.join(''));
		} else {
			// TODO:
			// Remove existing "no items" template
			// add twirly whirly.
			// Add no items template here.
		}
	}).fail(function() {
		debugger;
		console.dir(arguments);
	});

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
	function clearFix() {
		return '<div class="clearfix"></div>';
	}

	function hashtagButtonHtml(hashtag) {
		return 	'<button type="button" class="hidden js-data-button" data-toggle="modal"' +
				' data-target="#hashtag-modal" data-idx="' + hashtag.idx + '"' +
				' data-name="' + hashtag.name + '" data-frequency="' + hashtag.frequency +
				'" data-form-title="Edit Search Term">Edit hashtag</button>' +
				'<span class="glyphicon glyphicon-pencil" aria-hidden="true">' +
				'</span>&nbsp;&nbsp;&nbsp;&nbsp;' +
				'<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>';
	}

	function hashtagTemplate(hashtag) {
		hashtag.frequency = hashtag.frequency * 100;

		return '<tr class="hashtag">' +
					'<td>' +
						hashtagButtonHtml(hashtag) +
					'<td>' +
						'<a href="https://twitter.com/search?q=' + encodeURIComponent(hashtag.name) +
						'" target="_blank">' + hashtag.name + '</a>' +
					'</td>' +
					'<td>' +
						'<span>' + hashtag.frequency + '%</span>' +
					'</td>' +
				'</tr>';
	}

	function newRow(html) {
		return '<div class="row">' + html + '</div>';
	}

	function memeButtonHtml(meme) {
		// TODO:
		// Rethink how editing works.
		// https://desandro.github.io/3dtransforms/docs/card-flip.html
		// https://davidwalsh.name/css-flip
		// http://jsfiddle.net/iOnline247/y7zbnoad/
		return 	'<button class="delete" data-idx="' + meme.idx + '">Delete</button>' +
				'<button type="button" class="btn btn-primary btn-sm js-data-button" ' +
				'data-toggle="modal" data-target="#memes-modal" data-form-title="Edit Meme" ' +
				'data-url="' + meme.url + '" data-text="' + meme.text + '" data-idx="' + 
				meme.idx + '">' + '<span class="glyphicon glyphicon-pencil" aria-hidden="true">' +
				'</span>&nbsp;&nbsp;Edit meme</button>';
	}

	function memeTemplate(meme, addRow) {
		var html = '<div class="col-sm-6 col-md-4 meme">' +
						'<div class="thumbnail">' +
							'<img src="' + meme.url + '" alt="' + meme.text + '" class="img-circle">' +
							'<div class="caption">' +
								'<h3>' + meme.text + '</h3>' +
							'</div>' +
							'<p class="pull-right">' +
								memeButtonHtml(meme) +
							'</p>' +
							'<div class="clearfix"></div>' +
						'</div>' +
					'</div>';

		if(/addrow/i.test(addRow)) {
			html = newRow(html);
		}

		return html;
	}

	function notificationHtml() {
		return 	'<div class="js-notification pull-right">' +
					'<div class="alert alert-success">' +
						'<strong><span class="glyphicon glyphicon-ok-circle" ' +
						'aria-hidden="true"></span> Delete successful!</strong> ' +
						'<button class="js-undo pull-right"><strong>' +
						'<span class="glyphicon glyphicon-remove-circle" ' +
						'aria-hidden="true"></span> Undo?</strong></button>' +
					'</div>' +
				'</div>';
	}

	// Utils.
	function getThumbnailUrl(url, size) {
		url = url || '';
		var lastPeriod = url.lastIndexOf('.');
		var fileExtension = url.slice(lastPeriod);

		if(size === 'min') {
			return url.slice(0, lastPeriod) + 'b' + fileExtension;
		}
		// -1 will slice off the b that was added on the fly earlier.
		// and return large image.
		return url.slice(0, url.lastIndexOf('.') - 1) + fileExtension;
	}

	// Events
	// TODO:
	// Add class, remove "Search Term" selector.
	// Validation of form inputs.
	$modals.on('input propertychange', 'input:not([placeholder="Search Term"]), textarea:not(.meme-comment)', function(event) {
		var $this = $(this);
		var value = $this.val();

		// TODO:
		// fix this validation.
		var invalid = risBlank.test(value) && value !== '#';

		$this.toggleClass('js-valid', !invalid);
		$this.toggleClass('js-invalid', invalid);
	});

	// TODO:
	// Add class, remove "Image Url" selector.
	$modals.on('input propertychange', 'input[placeholder="Image Url"]', function(event) {
		var $this = $(this);
		var value = $this.val();
		var valid = rimgurUrl.test(value);

		$this.toggleClass('js-valid', valid);
		$this.toggleClass('js-invalid', !valid);
	});

	// TODO:
	// Add class, remove "Search Term" selector.
	// Validate search term input
	$modals.on('input propertychange', 'input[placeholder="Search Term"]', function(event) {
		var $this = $(this);
		var value = $this.val();
		var valid = !risBlank.test(value) || risValidHashtag.test(value);

		$this.toggleClass('js-valid', valid);
		$this.toggleClass('js-invalid', !valid);
	});

	// Toggle bot actions.
	$activeToggles.on('change', function(event) {
		var botAction = this.id.slice(0, this.id.lastIndexOf('-toggle'));

		$.ajax({
			url: '/botactions/' + botAction,
			type: 'PUT',
			data: {
				active: this.checked
			}
		});

		// TODO:
		// Add #fail logic
		// should reset to previous value and add error message.
	});

	// Undo deletion
	$('.notification-bar').on('click', '.js-undo', function(event) {
		var $this = $(this);
		var data = $this.data();

		clearTimeout(data.timer);

		// TODO:
		// Make this work for each tab.
		// Remove js-disabled on action element.
		$(data.tab).find('button.js-data-button[data-idx="' + data.idx + '"]')
			// TODO:
			// Use .delete on any deletion actions.
			.siblings('.glyphicon-remove').removeClass('js-disabled')
			// Bounce back to the button.
			.end()
			.closest(data.container).fadeIn(timings.fadeIn);

		// Remove Notification.
		$this.closest('.js-notification').animate({ opacity: 0 }, timings.notification, function() {
			$(this).remove();
		});
	});

	// TODO:
	// Remove delete and add to .delete event below.
	// Edit/Delete Hashtags buttons.
	$hashtags.on('click', '.glyphicon-pencil, .glyphicon-remove', function(event) {
		var $this = $(this);
		var isEdit = $this.hasClass('glyphicon-pencil');
		var $button = $this.siblings('button');
		var $tr = $this.closest('tr');
		var data = $button.data();
		var id = data.idx;

		if(isEdit) {
			$button.click();
		} else {
			$this.addClass('js-disabled');

			var $notification = $(notificationHtml()).addClass('js-off-screen');
			var timer;

			$('.notification-bar').prepend($notification);
			$notification.animate({ left: 0 }, timings.notification, function() {
				$notification.addClass('js-show-notification');

				var $notificationButton = $notification.find('button');

				timer = setTimeout(function() {
					$notificationButton.addClass('js-disabled');
					$notification.remove();

					$.ajax({
						url: '/hashtags/' + id,
						type: 'DELETE'
					}).then(function(data) {
						$tr.remove();
					});

					// console.warn('would have deleted this by now.');
					// TODO:
					// Implement #fail logic.
				}, timings.delete);

				$notificationButton.data({
					tab: '.hashtags',
					container: '.hashtag',
					timer: timer,
					idx: id
				});
			});

			$tr.fadeOut(timings.fadeOut);
		}
	});

	// Search Term New/Edit modal.
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

			$submit.button('loading');

			if(risBlank.test(hashtagVal) || !risValidHashtag.test(hashtagVal)) {
				invalid = true;
			}

			if(frequencyVal === '') {
				$frequency.addClass('js-invalid');
				invalid = true;
			}

			if(invalid) {
				$submit.button('reset');
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
				var $existingSearchTerm = $hashtags.find('.js-no-data, button[data-idx="' + hashtag.idx + '"]');
				var html = hashtagTemplate(hashtag);

				if($existingSearchTerm.length) {
					$existingSearchTerm.closest('tr').replaceWith(html);
				} else {
					$hashtags.append(html);
				}

				$hashtags.find('button[data-idx="' + hashtag.idx + '"]')
					.closest('tr')
					.css({ opacity: 0 })
					.animate({ opacity: 1 }, timings.opacity);
			}).fail(function(response) {
				// TODO:
				// Display fail message.
				// Recover gracefully.
				response.status;
				response.statusText;
				response.responseText;
				console.error('Hashtag - New/Edit failed');
				console.dir(arguments);
			}).always(function() {
				$modal.modal('hide');
				$submit.off(event);
			});
		});
	});

	// TODO:
	// Make this work for anything deletable.
	// Delete meme.
	$memes.on('click', '.delete', function(event) {
		event.preventDefault();
		var $this = $(this);
		var id = $this.data('idx');
		var $meme = $this.closest('.meme');

		$this.addClass('js-disabled');

		var $notification = $(notificationHtml()).addClass('js-off-screen');
		var timer;

		$('.notification-bar').prepend($notification);
		$notification.animate({ left: 0 }, timings.notification, function() {
			$notification.addClass('js-show-notification');
			var $notificationButton = $notification.find('button');

			timer = setTimeout(function() {
				$notificationButton.addClass('js-disabled');
				$notification.remove();

				$.ajax({
					url: '/memes/' + id,
					type: 'DELETE'
				}).then(function(data) {
					$meme.remove();
				});

				// console.warn('would have deleted this by now.');
				// TODO:
				// Implement #fail logic.
			}, timings.delete);

			$notificationButton.data({
				tab: '.memes',
				container: '.meme',
				timer: timer,
				idx: id
			});
		});

		$meme.fadeOut(timings.fadeOut);
	});

	// Memes New/Edit modal.
	$memesModal.on('show.bs.modal', function (event) {
		var $button = $(event.relatedTarget); // Button that triggered the modal
		var $modal = $(this);
		var $submit = $modal.find('.btn-primary');
		var $url = $modal.find('[placeholder="Image Url"]');
		var $comment = $modal.find('.meme-comment');
		var $idx = $modal.find('.js-index');
		var data = $button.data();
		var url = data.url;

		url = getThumbnailUrl(url);

		$url.val(url);
		$comment.val(data.text);
		$idx.val(data.idx);

		$submit.on('click', function(event) {
			var url = $url.val();
			var comment = $comment.val();
			var idx = $idx.val();
			var data = {
				url: url,
				text: comment
			};
			var dfd;

			$submit.button('loading');

			if(risBlank.test(url) || !rimgurUrl.test(url)) {
				$url.addClass('js-invalid');
				$submit.button('reset');
				return;
			}

			if(idx === '') {
				// New search term.
				dfd = $.post('/memes', data);
			} else {
				// Edit search term.
				dfd = $.ajax({
					url: '/memes/' + idx,
					type: 'PUT',
					data: data
				});
			}

			dfd.then(function(meme) {
				meme.url = getThumbnailUrl(meme.url, 'min');
				var $existingMeme = $memes.find('button[data-idx="' + meme.idx + '"]');
				var html = memeTemplate(meme);

				if($existingMeme.length) {
					$existingMeme.closest('.meme').replaceWith(html);
				} else {
					$memes.append(html);
				}

				$memes.find('button[data-idx="' + meme.idx + '"]')
					.closest('.meme')
					.css({ opacity: 0 })
					.animate({ opacity: 1 }, timings.opacity);
			}).fail(function(response) {
				// TODO:
				// Display fail message.
				// Recover gracefully.
				response.status;
				response.statusText;
				response.responseText;
				console.error('Meme - New/Edit failed');
				console.dir(arguments);
			}).always(function() {
				$modal.modal('hide');
				$submit.off(event);
			});
		});
	});
	// TODO:
	// Store $('.modal') globally within this function.
	$modals.on('show.bs.modal', function(event) {
		var $modal = $(this);
		var $button = $(event.relatedTarget);
		var data = $button.data();

		$modal.find('.modal-title').text(data.formTitle);
	});

	$modals.on('shown.bs.modal', function() {
		var $modal = $(this);
		$modal.find('input, textarea').first().focus();
	});

	$modals.on('hidden.bs.modal', function() {
		var $modal = $(this);
		var $submit = $modal.find('.btn-primary');

		$modal.find('.js-invalid').removeClass('js-invalid').val('');
		$modal.find('.js-valid').removeClass('js-valid').val('');
		$submit.button('reset');
	});
}(jQuery));