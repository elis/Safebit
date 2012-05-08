var sectionSettings = (function() {
	var updateEvery = 1000*60*5,
		section,
		port,
		base,
		safebitui;

	var stat = {
		timers: [],
		balance: [],
		transactions: [],
		balanceByLabel: {}
	};



	var sectionInit = function ($el) {
		safebitui = this;
		
		port = safebitui.port;
		base = safebitui.baseCall;
		section = $el;
		bindStuff();

		base('getSettings', function (result) {
			// Get all available currencies
			var curlist = $('.currency.radio-list', section);
			var selCurrency = safebitui.appSettings.currency || false;
			
			safebitui.setAppSettings(result);
			populateSettings(result);
			
			safebitui.baseCall('getBTCValue', function (curs) {
				curlist.empty();
				if (curs) {
					for (i in curs) {
						if (!curs[i].hasOwnProperty('24h')) continue;
						var currency = $('<label><input type="radio" name="currency" value="'+i+'"><span>'+i+' ('+curs[i]['24h']+' '+safebitui._.currency[i]+')</span></label>').appendTo(curlist);
						if (selCurrency == i) {
							$('input', currency).attr('checked', true);
							$(currency).addClass('checked');
						}
					}
				}
				var none = $('<label><input type="radio" name="currency" value="none"><span>None</span></label>').appendTo(curlist);
				if (!selCurrency) {
					$('input', none).attr('checked', true);
					$(none).addClass('checked');
				}
			});
		});
	};

	function populateSettings (data) {
		$('.rpc_user input', section).val(data.rpcuser);
		$('.rpc_password input', section).val(data.rpcpass);
		$('.rpc_port input', section).val(data.rpcport);
		$('.rpc_server input', section).val(data.rpcserver);
		console.log(data);
		$('#general_settings [name="devmode"]').attr('checked', data.devMode);
	}
	
	var saveSettingsSwitch = {
		'json-rpc': function () {
			var props = {
				rpcuser: $('.rpc_user input', section).val(),
				rpcpass: $('.rpc_password input', section).val(),
				rpcserver: $('.rpc_server input', section).val(),
				rpcport: $('.rpc_port input', section).val()
			};
			safebitui.baseCall('setSettings', function (result) {
				if (result === true) {
					$.jGrowl('New settings saved');
					safebitui.checkRpcServer();
				}
			}, props);
		},
		'currencies': function () {
			var currency = $('.currencies .radio-list .selected input', section).val();
			if (currency == 'none') currency = false;
			safebitui.appSettings.currency = currency;
			safebitui.baseCall('setSettings', function (result) {
			}, {currency: currency});
		},
		'general': function () {
			var devMode = !!$('#general_settings [name="devmode"]:checked', section).val();
			safebitui.setAppSettings({'devMode': devMode});
		}
	}

	function saveSettings (event) {
		
		saveSettingsSwitch[safebitui.activeSubSection]();
	}


	function safebitInit () {
	}
	function bindStuff () {
		$('.actions .save', section).bind('click', saveSettings);
		$(safebitui).bind('init', safebitInit);
		$(safebitui).bind('subSectionChanged', subSectionChange);
	}

	var confirmTx = function (e) {

	};

	var updateTxDetails,
		updateTxDetailsInit = (function() {
		var fromInput = $('input[name=account]', section),
			toInput = $('input[name=target]', section),
			amountInput = $('.amount input', section);

		var showDetails = function () {
			$('.txdetails', section).fadeIn(250);
		};

		updateTxDetails = function (e) {
			var amount = parseFloat(amountInput.val()),
				from = fromInput.val(),
				to = toInput.val();

			if (amount > 0) {
				showDetails();
			}
		};
	});
	
	function subSectionChange (event, subName) {
		if (safebitui.activeSection != 'settings') return;
		if (subName == 'currencies') {
		}
	}

	return {
		type: 'section',
		name: 'settings',
		section: '',
		init: sectionInit,
		show: function () {},
		beforeShow: function () {},
		reload: function () {},
		active: true,
		timers: stat.timers
	};
}());

if (typeof SafebitUI == 'undefined') {
	SafebitUI = [];
	SafebitUI.push(sectionSettings);
} else {
	SafebitUI.registerSection(sectionSettings);
}


