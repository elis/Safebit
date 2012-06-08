var sectionFunds = (function() {
	var updateEvery = 1000*60*5,
		$section,
		safebitui;
	
	var tempAccounts = {};

	var stat = {
		timers: [],
		balance: [],
		transactions: [],
		balanceByLabel: {}
	};

	/*
	Ok, I'm going to say it right here, the design behind this
	is not the greatest, instead of having a good database in the Base
	I'm doing direct calls to bitcoind, which isn't the greatest idea
	but it works for now. When time comes to sit down and write this
	to make a solid app, this and much more will be rewritten.
	For now my idea is to get the app out there...
	Eli, Aug 2011
	 */

	var sectionInit = function ($el) {
		safebitui = this;
		$section = $el;
		
		initSubSections();

		// prepareSendForm();
	};
	
	function initSubSections () {
		
		var received = Templates('receive').render(),
			params = {
				minconf: 1,
				includeempty: false
			};
		
		var formatSelection = function (item) {
			return "<span class='name'>"+
				item.account+
				"</span><span class='amount'>"+
				item.amount+"</span>";
		};
		var formatResult = function (item) {
			return item.account + "("+item.amount+")";
		};
		
		// Here needs to be a "waiting" message until data arrives from server
		safebitui.baseCall('listreceivedbyaccount', function (data) {
			console.log(data);
			var items = [], id, item;
			for (id in data) {
				items.push({
					text: "<span class='name'>"+
						data[id].account+
						"</span><span class='amount'>"+
						data[id].amount+"</span>",
					id: data[id].account
				})
			}
			
			var ain = $('.send-funds .account input', $section);
			
			window.ain = ain;
			
			ain.select2({
				placeholder: "Select an account to use",
				data: {
					results: data,
					text: function(item) { return item.text; }
				},
				formatResult: formatSelection,
				formatSelection: formatResult,
				
				minimumInputLength: 0,
				minimumResultsForSearch: 4,
				allowClear: true,
				multiple: true, // bad behaviour
				id: function (item) {
					return item.account;
				},
				
				yes: false
			});
			
			
			
			
		}, params);
		
	}

	function initAccountInputs () {
		// Check if we have accounts ready
		if (safebitui.data.accounts) {
			populateAccountsInput(safebitui.data.accounts);
		} else {
			var params = {
				minconf: 1,
				includeempty: false
			};
			safebitui.baseCall('listreceivedbyaccount', populateAccountsInput, params);
		}
	}
	
	function populateAccountsInput (data) {
		// This whole thing (including the AutoComplete) should be rewritten

		if (data && data.length > 0) {
			if (!safebitui.data.accounts) { safebitui.data.accounts = data; }

			
			var $select = $('.send-funds .account input', $section);

			var acCreate = function (event, ui) {
				var menu = $select.data('autocomplete').menu.element;

				// This hack is because the autocomplete widget forces it's own width settings
				$select.bind('autocompleteopen', function () {
					$(menu).addClass('dd-account').css('width', $select.outerWidth());
				})
			};

			var inputSource = function (request, result) {
				var term = request.term.toLowerCase(),
					found = [],
					data = safebitui.data.accounts;

				// This is going to be ugly, need to write a better way to search
				for (var i in data) {
					var label = data[i].label.toLowerCase(),
						account = data[i].account.toLowerCase();

					tempAccounts[label] = data[i];
					
					if (label.indexOf(term) != -1) {
						found.push(label);
					}
				}
				result(found);
			};

			var itemSelected = function (event, data) {
				
			};

			$select.smartSelect({
				source: inputSource,
				create: acCreate,
				select: itemSelected
			});

			$select.data('autocomplete')._renderItem = function (ul, item) {
				var label = item.label,
					account = tempAccounts[item.label]; // stat.balanceByLabel[label];
					
				if (!account.amount) return;
				
				var li = $('<li/>')
					.data( "item.autocomplete", item )
					.data('account', account)
					.append('<a>'+label+' <span>('+account.amount+')</span></a>')
					.appendTo(ul);
				return li;
			}
		}
	}

	function prepareSendForm () {
		var from = false,
			to = false,
			amount = false,
			account = false,
			fee = 0;

		var form = $('.send-funds', $section),
			$details = $('.txdetails', form),
			$fromInput = $('.account input', form),
			$targetInput = $('.target input', form),
			$amountInput = $('.amount input', form),
			$confirmButton = $('.actions .confirm', form);

		// DATA VALIDATION
		
		// From account 
		$fromInput.bind('change autocompletechange autocompleteselect', function (event, ui) {
			var val = $(this).val() || ui ? ui.item.value : false,
				$el = $(this);
			
			from = false;
			account = false;
			$el.removeClass('good error');
			if (val.length) {
				$el.addClass('good');
			}
			if (tempAccounts[val]) {
				// I don't have name collision detection, so if you have
				// more than one account with the same label, it will go
				// bad for now. Alpha... :)                          Eli

				account = tempAccounts[val];
				from = val;
				if (amount) {
					if (amount > account.amount) {
						from = false;
						$('.amount input', form).addClass('error').removeClass('good');
						$el.addClass('error').removeClass('good');
					} else {
						$('.amount input', form).removeClass('error').addClass('good');
						$el.removeClass('error').addClass('good');
					}
				} else {
					$el.addClass('good');
				}
			}

			$section.trigger('sendFormUpdated');
		});

		// TARGET (To Address)
		$targetInput.bind('change keyup', function (event) {
			to = false;

			var val = $(this).val(),
				$el = $(this);

			$el.removeClass('good error');
			if (val.length > 12) {
				safebitui.baseCall('validateaddress', function (result) {
					if (result.address == val && result.isvalid) {
						to = val;
						// console.log('val, to, result.address', val, to, result.address);
						$el.addClass('good');
					} else {
						to = false;
						$el.addClass('error');
					}
					$section.trigger('sendFormUpdated');
				}, [val])
			}
		});

		// Amount
		$amountInput.bind('change keyup', function (event) {
			var $el = $(this),
				val = $el.val();

			amount = false;
			$el.removeClass('good error');
			if (val.length) {
				amount = parseFloat(val);
			}

			if (amount > 0) {
				var account = from ? tempAccounts[from] : false;
				if (amount > safebitui.data.getinfo.balance) {
					amount = false;
					$el.addClass('error');
				} else if (account) {
					if (amount > account.amount) {
						amount = false;
						$el.removeClass('good').addClass('error');
						$('.account input').removeClass('good').addClass('error');
					} else {
						$el.removeClass('error').addClass('good');
						$('.account input').removeClass('error').addClass('good');
					}
				} else {
					$el.addClass('good');
				}
			}
			
			$section.trigger('sendFormUpdated');
		});
		
		/*
		Process the form handling
		*/
		
		$confirmButton.bind('click', function (event) {
			if (amount && to) {
				$ctx.dialog('open');
			}
		});

/*
888888ba  oo          dP                            
88    `8b             88                            
88     88 dP .d8888b. 88 .d8888b. .d8888b. .d8888b. 
88     88 88 88'  `88 88 88'  `88 88'  `88 Y8ooooo. 
88    .8P 88 88.  .88 88 88.  .88 88.  .88       88 
8888888P  dP `88888P8 dP `88888P' `8888P88 `88888P' 
                                       .88          
                                   d8888P           

    Dialogs */
    	
    	var ptxTemplate = Template('tx-processing-dialog'),
    		$ptx = ptxTemplate.el,
    		completeTxTemplate = Template('tx-sent'),
    		$completeTx = completeTxTemplate.el,
    		ctxTemplate = Template('confirm-tx'),
			$ctx = ctxTemplate.el;
    	
    	// Processing dialog
    	$ptx.dialog({
    		autoOpen: false,
    		modal: true,
    		resizable: false,
			title: 'Processing Transaction...',
			width: 400,
			closeText: '',
			dialogClass: 'blue'
			
    	});
    	
    	// Complete dialog
    	$completeTx.dialog({
    		autoOpen: false,
    		modal: true,
    		resizable: false,
			title: 'Transaction Confirmed',
			width: 400,
			closeText: '',
			dialogClass: 'green',
			buttons: {
				"Close": function (event) { $completeTx.dialog('close'); }
			}
    	});
    	
    	
		// Confirmation dialog
		$ctx.dialog({
			autoOpen: false,
			modal: true,
			resizable: false,
			title: 'Confirm Transaction',
			width: 400,
			closeText: '',
			dialogClass: 'yellow',
			buttons: {
				"Cancel": function (event) { $ctx.dialog('close'); }
			}
		});
		
		var $dialog = $($ctx).parent('.ui-dialog');
		
		// identify and add classes to buttons
		var $cancelButton = $('.ui-dialog-buttonpane button:contains("Cancel")', $dialog)
			.addClass('blue cancel');
		// var $okButton = $('.ui-dialog-buttonpane button:contains("Ok")', $dialog)
		// 	.addClass('green ok right')
		// 	.hide();
		
		
		// Verification input handling
		$('.amount', $ctx)
			.bind('keyup', function (event) {
				// Check if amount is good
				var val = parseFloat($(this).val());
				
				if (amount != val) {
					$(this).addClass('bad').removeClass('good');
				} else if (!val) {
					$(this).removeClass('bad good');
				} else {
					// this guy is legit, send the money...
					$ctx.dialog('close');
					$ptx.dialog('open');
					
					// Send the coins...
					safebitui.baseCall((account ? 'sendfrom' : 'sendtoaddress'), function(result) {
						if (result) {
							// function call to "payment sent"
							$ptx.dialog('close');
							$('.tx_id', $completeTx).text(result);
							$completeTx.dialog('open');
						}
						console.log('result from sending coins: ', result);
						safebitui.baseCall('update info');
						
					}, (account ? [account.account, to, amount] : [to, amount]));
				}
			})
			.addClass('blue');
		
		
		// Clean up the dialog after closing
		$ctx.bind('dialogclose', function() {
			$('.amount', $ctx).removeClass('bad good').val('');
		});
		
		// Clear the form after successful transaction
		$completeTx.bind('dialogclose', function() {
			to = from = account = amount = false;
			$('.amount input', form).val('').trigger('change');
			$('.account input', form).val('').trigger('change');
			$('.target input', form).val('').trigger('change');
			
			$('.actions .cancel', form).trigger('click');
		});
		
		
		
		
		
			// simulation
		if (false) { setTimeout(function() {
			$targetInput
				.val('miGuMc6qtVEKS6Pf1jKddaa81DeHjMzkpB')
				.trigger('keyup');
				
			$amountInput
				.val(1)
				.trigger('change');
				
		}, 250); }
		
		/*
		For now, all validation and fizz and fuzz around is
		done manually, sometime latter it will evolve into a
		small UI library or would use an exesting one.
		*/
		
		
/*
d888888P          888888ba             dP            oo dP          
   88             88    `8b            88               88          
   88    dP.  .dP 88     88 .d8888b. d8888P .d8888b. dP 88 .d8888b. 
   88     `8bd8'  88     88 88ooood8   88   88'  `88 88 88 Y8ooooo. 
   88     .d88b.  88    .8P 88.  ...   88   88.  .88 88 88       88 
   dP    dP'  `dP 8888888P  `88888P'   dP   `88888P8 dP dP `88888P' */	
   
   
   
		// Update Transaction details (on the right)
		$section.bind('sendFormUpdated', function (event) {
			if (from || to || amount) {
				// console.log('--------------------------------------');
				// console.info('performing update Details. Data dump: ');
				// console.log('from ', from);
				// console.log('to ', to);
				// console.log('amount ', amount);
				
				
				// Update all fields with the new data
				
				// Fee
				fee = (amount && amount < 0.01) ? 0.005 : 0 || (safebitui.data.getinfo.paytxfee ? 0.005 : 0);
				if (fee) {
					$('.tx_fee .amount', $details).text(fee);
					$('.tx_fee', $details).show();
				} else {
					$('.tx_fee', $details).hide();
				}
				
				// From account handling
				var account = from ? (tempAccounts[from] || false) : false;
				
				if (from && account) {
					$('.info .from.account', $details).text(account.label);
					$('.account_balance').show();
					$('.account_balance .amount').text(account.amount);
					
					var z = (amount ? account.amount - amount : account.amount) - fee;
					$('.account_balance .after .amount').text(z);	
					
					
					// console.log('Account: ', account);
				} else {
					$('.info .from.account', $details).text('wallet');
					$('.account_balance').hide();
				}
				
				
				// Wallet balance
				var balance = SafebitUI.data.getinfo.balance || false;
				if (balance) {
					$('.wallet_balance .amount').text(balance);
					
					var z = balance - (amount || 0) - fee;
					$('.wallet_balance .after .amount').text(z);
					
					// console.log('Balance: ', balance);
				} else {
					// If no balance everything should brake :O
				}
				
				// Amount handling
				if (amount) {
					$('.info .amount', $details).text(amount);
					$('.tx_amount .amount', $details).text(amount);
				} else {
					$('.info .amount', $details).text('0.00');
					$('.tx_amount .amount', $details).text('0.00');
				}
				
				// Target
				if (to) {
					// Sample: miGuMc6qtVEKS6Pf1jKddaa81DeHjMzkpB (Testnet Faucet)
					$('.info .to').text(to);
				} else {
					$('.info .to').text('bitcoin address');
				}
				
				if (to && amount) {
					$confirmButton.removeClass('disabled');
				} else {
					$confirmButton.addClass('disabled');
				}
				
				$details.fadeIn(350);
				
				// console.log('End data dump for update details.');
				// console.log('--------------------------------------');
			} else {
				$confirmButton.addClass('disabled');
				$details.fadeOut(150);
				// console.log('no details, please hide');
			}
		});
		
		
		
		// Navigate back to welcome
		$('.actions .cancel', $section).bind('click', function (event) {
			safebitui.activateSubSection('welcome', $section);
		});
				
		
		
		$details.hide();
		
		initAccountInputs();
		$section.trigger('sendFormUpdated');
	}

	return {
		type: 'section',
		name: 'funds',
		section: '',
		init: sectionInit,
		show: function () {},
		beforeShow: function (section) {
			if (!window.counter) window.counter = 1;
			console.log(++window.counter, section);
		},
		reload: function () {},
		active: true,
		timers: stat.timers
	};
}());

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionFunds);
} else {
	SafebitUI.registerSection(sectionFunds);
}
