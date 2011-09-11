(function($) {
	$.widget("ui.smartSelect", {
		options: {
			source: function () {},
			create: function () {},
			open: function () {},
			close: function () {},
			select: function () {}
		},
		_create: function (a,b,c) {
			var self = this,
				$el = this.element;
			
			var open = false;
				
			var elPos = $el.position(),
				elWidth = $el.width();
			
			var button = $('<div/>')
				.addClass('dropdown-button')
				.html('&#9660;')
				.insertAfter($el)
				.css({
					position: 'absolute',
					top: elPos.top,
					left: elPos.left + elWidth
				}).click(function() {
					if ($el.val().length == 0) {
						if ($el.autocomplete()) {}
					}
				}).bind({
					'click': function (e) {
						if (!open) {
							$el.autocomplete('search', '');
						} else {
							$el.autocomplete('close');
						}
						e.stopPropagation();
					}
				});
				
			$(window).bind('resize', function(e) {
				var elPos = $el.position(),
					elWidth = $el.width();
				button.css({
					top: elPos.top,
					left: elPos.left + elWidth
				});
			});
			
			$el.bind({
				autocompleteopen: function (e) {
					open = true;
				},
				autocompleteclose: function (e) {
					open = false;
				}
			})
			
			$el.autocomplete({
				delay: 0,
				minLength: 0,
				source: self.options.source,
				select: self.options.select
			});
			$(document).bind('mousemove', function () {
				//	$el.autocomplete('search', '');
			});
		}
	})
}(jQuery));
