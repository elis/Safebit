var sectionAccounts = (function() {
	var updateEvery = 1000*60*5,
		$section,
		safebitui;
		
	function sectionInit ($el) {
		safebitui = this;
		$section = $el;
		updateEvery = safebitui.updateInterval || updateEvery;
		
		if (safebitui.data.hasOwnProperty('accounts')) {
			initAccounts(safebitui.data.accounts);
		} else {
			safebitui.baseCall('listaccounts', initAccounts, [1]);
		}
		
		$('.manage-accounts .changing', $section).hide();
		$('.manage-accounts .changing .actions .cancel-action', $section).bind('click', function (event) {
			$('.manage-accounts .changing', $section).hide();
		});
	}
	
	function initAccounts (accounts) {
		var accarr = [],		
			list = $('.manage-accounts .accounts .list', $section);
			
		
		for (i in accounts) {
			accarr.push({account: i, amount: accounts[i]});
		}
		
		accarr.sort(function (a, b) {
			if (a.amount > b.amount) return -1;
			if (a.amount < b.amount) return 1;
			return 0;
		});
		
		for (i in accarr) {
			var amount = accarr[i].amount,
				account = accarr[i].account || 'Global',
				note = localStorage['account-note-'+account] || '',
				template = Template('account-block'),
				$acc = template.el;
			
			$acc;
			if (!amount) $acc.addClass('small');
			$('h3', $acc).text(account);
			$('h4', $acc).text(note);
			$('.main.currency .amount', $acc).text(safebitui.utils.numberFormat(amount));
			
			$('.secondary.currency', $acc).hide();
			$acc.amount = amount;
			$acc.data('account', account);
			$acc.data('balance', amount);
			
			$acc.appendTo(list);
		}
		
		$('.actions .notes', list).bind('click', editNotes);
		$('.actions .edit', list).bind('click', editAccount);
	}
	
	
	
	
	var notesTemplate = Template('account-edit-notes'),
		$notes = notesTemplate.el;
		
	function editNotes (event) {
		var $acc = $(this).parents('.account'),
			account = $acc.data('account'),
			balance = $acc.data('balance'),
			note = localStorage['account-note-'+account],
			$changing = $('.manage-accounts .changing .con', $section);
		
		$('.manage-accounts .changing', $section).show();
		
		$('.manage-accounts .changing .actions .save', $section).unbind('click').bind('click', function (event) {
			var val = $('.note textarea', $changing).val()
			localStorage['account-note-'+account] = val;
			$changing.empty();
			$('.manage-accounts .changing .actions .save', $section).unbind('click');
			$('.manage-accounts .changing', $section).hide();
			
			$('h4', $acc).text(val);
		});
		
		$changing.empty();
		$notes.appendTo($changing);
		$('h3 .account', $notes).text(account);
		$('.note textarea', $notes).val(note);
	}
	
	
	var configTemplate = Template('account-config'),
		$conf = configTemplate.el;
	
	function editAccount (event) {
		var $acc = $(this).parents('.account'),
			account = $acc.data('account'),
			$changing = $('.manage-accounts .changing .con', $section),
			$list = $('ul.addresses', $conf);
		
		// omg... this is a mess...
		$changing.empty();
		$('.manage-accounts .changing', $section).show();
		$conf.appendTo($changing);
		$conf.addClass('waiting');
		$list.empty();
		
		safebitui.baseCall('getaddressesbyaccount', function (result) {
			if (result) {
				$conf.removeClass('waiting');
				for (i in result) {
					var li = $('<li class="address">'+ result[i] + '</li>').appendTo($list);
				}
			}
		}, [account])
		
	}

	return {
		type: 'section',
		name: 'accounts',
		section: '',
		init: sectionInit,
		show: function () {},
		beforeShow: function () {},
		reload: function () {},
		active: true
	};
}());

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionAccounts);
} else {
	SafebitUI.registerSection(sectionAccounts);
}


