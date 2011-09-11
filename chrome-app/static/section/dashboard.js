/**
 * Dashboard Manager
 * 
 * Events:
 *   infoReady
 *   
 */


var sectionDashboard = function () {
	var updateEvery = 1000*60,
		section,
		safebitui,
		template,
		$section,
		self;
	
	var stat = {
		timers: {},
		balance: [],
		transactions: []
	};
	
	
	
	var sectionInit = function ($el) {
		section = $el.data('section');
		template = section.template;
		$section = template.el;
		safebitui = this;
		updateEvery = safebitui.updateInterval || updateEvery;
		

		if (safebitui.status.rpc) {
			updateDashboard();
		} else {
			$(safebitui).bind('rpcConnect', updateDashboard);
		}
	};

	var sectionDestroy = function () {
		for (var i in stat.timers) {
			clearTimeout(stat.timers[i]);
		}
	};

	var updateDashboardTimeout;
	function updateDashboard () {
		if (updateDashboardTimeout) {
			clearTimeout(updateDashboardTimeout);
			updateDashboardTimeout = null;
		}
		// Get balance
		updateBalance();

		// Get transactions
		/*
		The original plan was to wait for updateBalance to finish
		to request transaction details, this is because the API docs
		say that you can get transaction listing only for 1 account
		at a time. This how it was in the original version of Safebit,
		but when moving to Safebit as a Chrome App I noticed that
		it's possible to request transactions with associating an
		account to it, so until the bug in Bitcoind is fixed or if
		the docs update and show that you can request transactions
		for more than one account (i.e. all of them), I'm running
		updateTransactions in sync with updateBalance because I don't
		need individual accounts before request transactions list.
		Eli, Aug 2011
		 */
		updateTransactions();

		// Get planned transactions

		// Create auto update
		updateDashboardTimeout = setTimeout(updateDashboard, updateEvery);
	}

	function updateBalance () {
		$('.box.balance', $section).addClass('waiting');
		safebitui.baseCall('listaccounts', listAccounts, [1]);
	}
	
	function listReceivedByAccount (data) {
		if (data && data.hasOwnProperty('length') && data.length > 0) {
			var $tbody = $('.balance tbody', $section);
			$.extend(safebitui.data, {'accounts': data});

			$tbody.empty();
			for (var i in data) {
				var row = Template('dashboard-balance-row'),
					$row = $(row.el),
					item = data[i];
				$('.name', $row).text(item.account);
				$('.amount', $row).text(item.amount);
				$row.appendTo($tbody);
			}
		}
		$('.box.balance', $section).removeClass('waiting');

		// Get transactions...
	}
	
	function listAccounts (data) {
		if (data) {
			var $tbody = $('.balance tbody', $section);
			
			$tbody.empty();
			var accounts = [];
			for (i in data) {
				if (!i) continue;
				
				accounts.push({
					account: i,
					amount: parseFloat(data[i]),
					confirmations: 'Not Implemented',
					label: i
				});
				var account = accounts[accounts.length-1];
				
				if (account.amount > 0) {
					var row = Template('dashboard-balance-row'),
						$row = $(row.el);
					$('.name', $row).text(account.account);
					$('.amount', $row).text(account.amount);
					$row.appendTo($tbody);
				}
			}
			
			$.extend(safebitui.data, {'accounts': data});
			
		}
		$('.box.balance', $section).removeClass('waiting');

		// Get transactions...
	}

	function updateTransactions () {
		$('.box.transactions .past', $section).addClass('waiting');
		safebitui.baseCall('listtransactions', listTransactions);
	}
	
	function listTransactions (data) {
		var $tbody = $('.transactions .past tbody', $section);
		
		if (data && data.hasOwnProperty('length') && data.length > 0) {
			$tbody.empty();

			for (var i in data) {
				var row = Template('dashboard-transaction'),
					$row = $(row.el),
					item = data[i];

				$('th .action', $row).attr('rel', 'transaction/' + item.txid).attr('title', 'Transaction ID: ' + item.txid);
				$('th .account', $row).attr('rel', 'account/' + (item.account || 'Global')).text(item.account || 'Global');
				$('th small', $row).text((item.category == 'receive' ? 'Received' : 'Sent') + ': ' + item.amount);
				$('.currency .amount', $row).text(item.amount);
				$('.time', $row).text(item.time);
				$row.addClass(item.category);
				$row.prependTo($tbody);
			}
		}
		$('.box.transactions .past', $section).removeClass('waiting');
	}

	var getTransactions = function () {

		$('.transactions.box .past').addClass('waiting');

		if (stat.balance.length > 0) {
			var checkResult = [],
				combinedResult = [];

			for (i in stat.balance) {
				var rec = stat.balance[i],
					account = rec.account

				checkResult.push(account);
				$.getJSON('/api/listTransactions', {account: account}, function (data) {
					var transactions = data.result;

					combinedResult = combinedResult.concat(transactions);

					checkResult.splice(checkResult.indexOf(account));

					if (checkResult.length == 0) {
						putTransactions(combinedResult);
					}
				});
			}
		}
	};

	return {
		type: 'section',
		name: 'dashboard',
		section: '',
		init: sectionInit,
		destroy: sectionDestroy,
		show: function () {},
		beforeShow: function () {},
		reload: function () {},
		timers: stat.timers
	};
};

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionDashboard);
} else {
	SafebitUI.registerSection(sectionDashboard());
}
