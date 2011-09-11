/**
 * Dashboard Manager
 * 
 * Events:
 *   infoReady
 *   
 */


var sectionDashboard = function () {
	var updateEvery = 1000*60*5,
		self;
	
	var stat = {
		timers: {},
		balance: [],
		transactions: []
	};
	
	
	
	var sectionInit = function ($el) {
		var section = $el.data('section'),
			template = section.template;
			
		self = this;
			
			
		var getBalance = function () {
			var tbody = $('.balance tbody', $el);
			
			$('.box.balance', $el).addClass('waiting');
					
			$.getJSON('/api/listReceivedByAccount', function (data){
				if (typeof data == 'object' && data['result'] != 'undefined') {
					$(self).trigger('listReceivedByAccount', [data.result]);
					
					tbody.empty();
					for (i in data.result) {
						var row = Template('dashboard-balance-row'),
							$row = $(row.el),
							item = data.result[i];
						
						$('.name', $row).text(item.account);
						$('.amount', $row).text(item.amount);
						$row.appendTo(tbody);
					}
					stat.balance = data['result'];
				}
				getTransactions();
				
				$('.box.balance', $el).removeClass('waiting');
				section.balance = data['result'];
			});
			stat.timers['getBalance'] = setTimeout(getBalance, updateEvery);
		};
		
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
		}
		
		var putTransactions = function (transactions) {
			var $pastbody = $('.transactions .past tbody').empty();
			
			
			var t = transactions.sort(function (a, b) { return b.time - a.time; });
			
			for (i in t) {
				var transaction = t[i],
					_ = SafebitUI._,
					time = new Date(transaction.time * 1000),
					date = _['day_full'][time.getDay()] + ', ' + _['month_short'][time.getMonth()] + ' ' + time.getDate();
				
				transaction.date = date;
				
				
				row = Template('dashboard-transaction');
				$('.account', row.el).text(transaction.account);
				$('th small', row.el).text('[ '+transaction.address.substr(0, 7)+'... ]');
				$(' .amount', row.el).text(transaction.amount);
				$('.time', row.el).text(transaction.date)
				
				$(row.el).addClass('incoming');
				
				$(row.el).appendTo($pastbody);
			}
			
			$('.transactions.box .past').removeClass('waiting');
			
			section.transactions = t;
		}
		
		
		
		getBalance();
	}
	
	
	
	return {
		type: 'section',
		name: 'dashboard',
		section: '',
		init: sectionInit,
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
