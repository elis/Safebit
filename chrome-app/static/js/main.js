/*
 * 
 * Main (section un-related) bindings
 * 
 */
var mainClientStuff = function() {
	var updateEvery = 1000*60; // Every 60 seconds

	var stat = {}, // Static variable to share in here
		safebitui,
		self; // reference to SafebitUI instance
	
	var mainInit = function () {
		safebitui = this;
		updateEvery = safebitui.updateInterval || updateEvery;
		
		$(this).bind('domready', mainDomready);
		getinfoUpdate();
	};
	
	var mainDomready = function () {
		$(safebitui).bind('dataUpdate', safebitDataUpdate);
		
		// Navigate back to welcome
		$('section .actions .cancel').live('click', function (event) {
			var $section = $(this).parents('section');
			safebitui.activateSubSection('welcome', $section);
		});
		
		// Close
		$('#control #exit').bind('click', function () {
			window.close();
		})
	};
	
	function safebitDataUpdate (event, id, data) {
		if (dataUpdates.hasOwnProperty(id)) {
			dataUpdates[id].call(safebitui, data);
		}
	}
	
	function updateBTCValue (result) {
		var btcs = safebitui.data.getinfo.balance,
			currency = safebitui.appSettings.currency,
			selcur = result[currency],
			btcincur = btcs * selcur['24h'],
			symbol = safebitui._.currency[currency],
			curText = safebitui.utils.numberFormat(btcincur, 2, true);
		
		var $othercur = $('#info .othercur');
		
		$('.amount', $othercur).text(curText);
		$('.symbol', $othercur).text(symbol);
		
		safebitui.data.currencies = result;
		
		$(safebitui).trigger('currenciesUpdated', result);
	}

	/**
	 * Data Updates handling
	 */
	var btcAmount = $('#wallet-size .btc .amount');

	var dataUpdates = {
		getinfo: function (data) {
			if (data.hasOwnProperty('balance')) {
				btcAmount.text(data.balance);
			}
		}
	};
	
	var getinfoTimeout;
	var getinfoUpdate = function () {
		if (safebitui.appSettings.currency && safebitui.appSettings.currency != 'none') {
			safebitui.baseCall('getBTCValue', updateBTCValue);
		}
		safebitui.baseCall('update info');
		getinfoTimeout = setTimeout(getinfoUpdate, updateEvery);
	};
	
	
	return {
		type: 'init',
		name: 'main',
		init: mainInit
	};
};

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionDashboard);
} else {
	SafebitUI.registerInit(mainClientStuff());
}

/*
getinfo():
	balance: 165
	blocks: 33119
	connections: 8
	difficulty: 146.71330628
	errors: ""
	generate: false
	genproclimit: -1
	hashespersec: 0
	keypoololdest: 1312554917
	paytxfee: 0
	proxy: ""
	testnet: true
	version: 32400
 */