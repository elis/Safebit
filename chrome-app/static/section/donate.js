var donationSection = (function(){
	var safebitui,
		$section,
		firstTime;
		
	var donateAmount = 0.5;
	
	// This is my donation address ;) -Eli
	var sendTo = "1Cm554iqhU9dLnZsi2LA5s1b576DdfM1GM";
	sendTo = 'miGuMc6qtVEKS6Pf1jKddaa81DeHjMzkpB';
	
	
	
	var confirmDialogTemplate = Template('confirm-donation-dialog'),
		$confirmDonation = confirmDialogTemplate.el,
		customDonationTemplate = Template('custom-donation-dialog'),
		$customDonation = customDonationTemplate.el,
		donationSentTemplate = Template('donation-sent-dialog'),
		$thanksDialog = donationSentTemplate.el;
	
	// Confirm Donation dialog
	$confirmDonation.dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		title: 'Confirm Donation',
		width: 400,
		closeText: '',
		dialogClass: 'yellow',
		buttons: {
			"Confirm": function (event) {
				$confirmDonation.dialog('close'); 
				
				console.log('About to donate ', donateAmount, ' to: ', sendTo);
				
				// Send the coins...
				safebitui.baseCall('sendtoaddress', function(result) {
					if (result) {
						// function call to "payment sent"
						$('.tx_id', $thanksDialog).text(result);
						$thanksDialog.dialog('open');
					}
					console.log('result from sending coins: ', result);
					safebitui.baseCall('update info');
					
				}, [sendTo, donateAmount]);
			},
			"Cancel": function (event) {
				$confirmDonation.dialog('close'); 
			}
		},
		create: function () {
			var dlg = $(this).parent('.ui-dialog')
			var $confirmButton = $('.ui-dialog-buttonpane button:contains("Confirm")', dlg)
				.addClass('blue right confirm');
		}
	});
	
	// Custom Donation dialog
	$customDonation.dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		title: 'Donate to Safebit',
		width: 400,
		closeText: '',
		dialogClass: 'yellow',
		buttons: {
			"Confirm": function (event) {
				var dlg = $(this).parent('.ui-dialog'),
					amount = parseFloat($('.amount', dlg).val());
				if (amount > 0.00000001) {
					$customDonation.dialog('close');
					// Send the coins...
					safebitui.baseCall('sendtoaddress', function(result) {
						if (result) {
							// function call to "payment sent"
							$('.tx_id', $thanksDialog).text(result);
							$thanksDialog.dialog('open');
						}
						console.log('result from sending coins: ', result);
						safebitui.baseCall('update info');
						
					}, [sendTo, amount]);
				}
			},
			"Cancel": function (event) {
				$confirmDonation.dialog('close'); 
			}
		},
		create: function () {
			var dlg = $(this).parent('.ui-dialog')
			var $confirmButton = $('.ui-dialog-buttonpane button:contains("Confirm")', dlg)
				.addClass('blue right confirm');
			$('form', dlg).bind('submit', function (event) {
				event.stopPropagation();
				event.preventDefault();
				$confirmButton.trigger('click');
			})
		}
	});
	
	// Thanks dialog
	$thanksDialog.dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		title: 'Thanks for you\'re support!',
		width: 400,
		closeText: '',
		dialogClass: 'blue',
		buttons: {
			"Close": function (event) { $thanksDialog.dialog('close'); }
		}
	});
	
	
	function sectionInit ($el) {
		$section = $el;
		safebitui = this;
		
		bindStuff();
		
		$(safebitui).bind('currenciesUpdated', function (event, currencies) {
			updateCurrencies(currencies);
		});
		if (safebitui.data.hasOwnProperty('currencies')) {
			updateCurrencies(safebitui.data.currencies);
		} else {
			safebitui.baseCall('getBTCValue', updateCurrencies);
		}
		
	}
	
	function bindStuff () {
	}
	
	
	function updateCurrencies (currencies) {
		var selCurrency = safebitui.appSettings.currency || 'USD',
			currency = currencies[selCurrency]['24h'],
			symbol = safebitui._.currency[selCurrency],
			btc;
		
		btc = safebitui.utils.numberFormat(0.5*currency);
		$('.intro-buttons .donate-05 .currency .amount').text(btc);
		$('.intro-buttons .donate-05 .currency .symbol').text(symbol);
		
		btc = safebitui.utils.numberFormat(1*currency);
		$('.intro-buttons .donate-1 .currency .amount').text(btc);
		$('.intro-buttons .donate-05 .currency .symbol').text(symbol);
		
		if (!firstTime) {
			$('.intro-buttons .donate-05 a').bind('click', function (event) {
				donateAmount = 0.5;
				var curval = safebitui.utils.numberFormat(currency * 0.5);
				$('.currency.btc .amount', $confirmDonation).text('0.50');
				$('.currency.other .amount', $confirmDonation).text(curval);
				$('.currency.other .symbol', $confirmDonation).text(symbol);
				
				$confirmDonation.dialog('open');
			});
			
			$('.intro-buttons .donate-1 a').bind('click', function (event) {
				donateAmount = 1;
				var curval = safebitui.utils.numberFormat(currency * 1);
				$('.currency.btc .amount', $confirmDonation).text('1');
				$('.currency.other .amount', $confirmDonation).text(curval);
				$('.currency.other .symbol', $confirmDonation).text(symbol);
				
				$confirmDonation.dialog('open');
			});
			
			$('.intro-buttons .donate-other a').bind('click', function (event) {
				$customDonation.dialog('open');
			});
			firstTime = false;
		}
	}
	
	
	
	return {
		type: 'section',
		name: 'donate',
		section: '',
		init: sectionInit,
		show: function () {},
		beforeShow: function () {},
		reload: function () {}
	};
}());
if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(donationSection);
} else {
	SafebitUI.registerSection(donationSection);
}