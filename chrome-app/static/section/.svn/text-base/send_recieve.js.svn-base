var sectionSendRecieve = function () {
	var updateEvery = 1000*60*5,
		self;
	
	var stat = {
		timers: [],
		balance: [],
		transactions: [],
		balanceByLabel: {}
	};
	
	var sectionInit = function ($el) {
		self = this;
		var $select = $('.account input');
		
		$(self).bind('listReceivedByAccount', function (event, list) {
			if (list.length > 0) {
				stat.balance = list;
				for (i in stat.balance) {
					var item = stat.balance[i];
					stat.balanceByLabel[item.label] = item;
				}
			}
		});
		
		var acCreate = function (event, ui) {
			var menu = $select.data('autocomplete').menu.element;
			
			// This hack is because the autocomplete widget forces it's own width settings
			$select.bind('autocompleteopen', function () {
				$(menu).addClass('dd-account').css('width', $select.outerWidth());
			})
		};
		
		var accountInput = function (request, result) {
			var term = request.term.toLowerCase(),
				found = [];
			
			if (stat.balance.length > 0) {
				// This is going to be ugly, need to write a better way to search
				for (i in stat.balance) {
					var label = stat.balance[i].label.toLowerCase(),
						account = stat.balance[i].account.toLowerCase();
					
					
					
					if (label.indexOf(term) != -1) {
						found.push(stat.balance[i].label);
					}
				}
			} else {
				// .. Make sure that we have the data
				// pass
			}
			result(found);
		};
		
		$select.smartSelect({
			source: accountInput,
			create: acCreate
		});
		
		$select.data('autocomplete')._renderItem = function (ul, item) {
			var label = item.label,
				account = stat.balanceByLabel[label];
			var li = $('<li/>')
				.data( "item.autocomplete", item )
				.data('account', account)
				.append('<a>'+label+' <span>('+account.amount+')</span></a>')
				.appendTo(ul);
			
			return li
		}
	}
	
	
	
	return {
		type: 'section',
		name: 'send_recieve',
		section: '',
		init: sectionInit,
		show: function () {},
		beforeShow: function () {},
		reload: function () {},
		active: true,
		timers: stat.timers
	};
};

(function($) {
	$.widget("ui.smartSelect", {
		options: {
			source: function () {},
			create: function () {},
			open: function () {},
			close: function () {},
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
				source: self.options.source
			});
			$(document).bind('mousemove', function () {
				//	$el.autocomplete('search', '');
			});
		}
	})
}(jQuery));

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionSendRecieve);
} else {
	SafebitUI.registerSection(sectionSendRecieve());
}



(function( $ ) {
	$.widget( "ui.combobox", {
		_create: function() {
			var self = this,
				select = this.element.hide(),
				selected = select.children( ":selected" ),
				value = selected.val() ? selected.text() : "";
				
			var input = this.input = $( "<input>" )
				.insertAfter( select )
				.val( value )
				.autocomplete({
					delay: 0,
					minLength: 0,
					source: function( request, response ) {
						var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
						response( select.children( "option" ).map(function() {
							var text = $( this ).text();
							if ( this.value && ( !request.term || matcher.test(text) ) )
								return {
									label: text.replace(
										new RegExp(
											"(?![^&;]+;)(?!<[^<>]*)(" +
											$.ui.autocomplete.escapeRegex(request.term) +
											")(?![^<>]*>)(?![^&;]+;)", "gi"
										), "<strong>$1</strong>" ),
									value: text,
									option: this
								};
						}) );
					},
					select: function( event, ui ) {
						ui.item.option.selected = true;
						self._trigger( "selected", event, {
							item: ui.item.option
						});
					},
					change: function( event, ui ) {
						if ( !ui.item ) {
							var matcher = new RegExp( "^" + $.ui.autocomplete.escapeRegex( $(this).val() ) + "$", "i" ),
								valid = false;
							select.children( "option" ).each(function() {
								if ( $( this ).text().match( matcher ) ) {
									this.selected = valid = true;
									return false;
								}
							});
							if ( !valid ) {
								// remove invalid value, as it didn't match anything
								$( this ).val( "" );
								select.val( "" );
								input.data( "autocomplete" ).term = "";
								return false;
							}
						}
					}
				})
				.addClass( "ui-widget ui-widget-content ui-corner-left" );

			input.data( "autocomplete" )._renderItem = function( ul, item ) {
				return $( "<li></li>" )
					.data( "item.autocomplete", item )
					.append( "<a>" + item.label + "</a>" )
					.appendTo( ul );
			};

			this.button = $( "<button type='button'>&nbsp;</button>" )
				.attr( "tabIndex", -1 )
				.attr( "title", "Show All Items" )
				.insertAfter( input )
				.button({
					icons: {
						primary: "ui-icon-triangle-1-s"
					},
					text: false
				})
				.removeClass( "ui-corner-all" )
				.addClass( "ui-corner-right ui-button-icon" )
				.click(function() {
					// close if already visible
					if ( input.autocomplete( "widget" ).is( ":visible" ) ) {
						input.autocomplete( "close" );
						return;
					}

					// work around a bug (likely same cause as #5265)
					$( this ).blur();

					// pass empty string as value to search for, displaying all results
					input.autocomplete( "search", "" );
					input.focus();
				});
		},

		destroy: function() {
			this.input.remove();
			this.button.remove();
			this.element.show();
			$.Widget.prototype.destroy.call( this );
		}
	});
})( jQuery );
