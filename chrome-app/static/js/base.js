var safebitBase, btcd;
safebitBase = (function($) {
	var base,
		appSettings,
		appPort;
	
	function SafebitBase () {
		base = this;
		createPortListener();
		initAppSettings();
	}

	var pub = {};

	pub.apiCall = function (msg) {
		console.debug('API Call to Base: ', msg);
		console.log(msg);
	};

	$.extend(SafebitBase.prototype, pub);

	var defaultSettings = {
		currency: false,
		
		devMode: false,
		
		// RPC
		rpcuser: '',
		rpcpass: '',
		rpcport: '8332',
		rpcssl: false,
		rpcserver: 'localhost'
	};

	function initAppSettings () {
		var settings = $.extend({}, defaultSettings),
			raw = window.localStorage['settings'];
		if (typeof raw == 'undefined') {
			// Insert new settings to local storage
			$.extend(settings, defaultSettings);
			var jsonized = JSON.stringify(settings);
			window.localStorage['settings'] = jsonized;
		} else {
			// Parse settings from local storage
			var parsed = JSON.parse(raw);
			settings = $.extend(settings, parsed);
		}

		appSettings = settings;
	}


	function createPortListener () {
		chrome.extension.onRequest.addListener(extRequest);

		chrome.extension.onConnect.addListener(function (port) {
			console.log('Listener connected', port);
			if (port.name == 'SafebitBase') {
				appPort = port;
				port.onMessage.addListener(function (msg) {
					base.apiCall.call(base, msg);
				});
			}
		});
	}

	function RPCErrorCallback (textStatus, callback, errorThrown) {
		if (textStatus == 'error') {
			callback({'error': 'Error occurred connecting to RPC Server', 'details': [appSettings]});
		}
	}

	// Extension Request (baseCall usually)
	function extRequest(request, sender, callback) {
		if (typeof request != 'object') {
			callback({'error': 'Bad request'});
		}
		
		else if (typeof request.action != 'string') {
			callback({'error': 'Request needs action'});
		} 
		
		else if (allowedRPCAPICalls.indexOf(request.action) >= 0) {
			console.log('RPC Direct Call', request.action, allowedRPCAPICalls.indexOf(request.action));
			RPCApi.call(base, request.action, request.params, callback);
		}
		
		
		else if (api.hasOwnProperty(request.action) == false) {
			callback({'error': 'Unknown request action', 'details': {'action': request.action}}); 
		} 
		
		else {
			console.info('Extension request', request.action, request);
			api[request.action].call(base, callback, request.params);
		}
	}

	var api = {};
	api.getSettings = function (callback, params) {
		callback(appSettings);
	};
	api.setSettings = function (callback, params) {
		$.extend(appSettings, params);
		var jsonized = JSON.stringify(appSettings);
		localStorage['settings'] = jsonized;
		callback(true);
	};
	
	// Get the value of BTC in other currencies
	api.getBTCValue = function (callback, params) {
		var currenciesUpdateEvery = 1000*60*15; // 15 Minutes
		if (localStorage.hasOwnProperty('currencies')) {
			var currencies = JSON.parse(localStorage['currencies']),
				now = new Date().getTime(),
				lastUpdate = currencies.lastUpdate,
				timediff = now - lastUpdate;
			
			if (timediff < currenciesUpdateEvery) {
				callback(currencies);
				return;
			}
		}
		
		
		$.getJSON('http://bitcoincharts.com/t/weighted_prices.json', function (result) {
			result.lastUpdate = new Date().getTime();
			
			var jsonized = JSON.stringify(result);
			localStorage['currencies'] = jsonized;
			
			callback(result);
		});
	}


	
	api['update info'] = function (callback) {
		var params = {
			'method': 'getinfo',
			'params': [],
			'id': 'getinfo'
		};
		
		JSONRPC('getinfo', function (data, textStatus) {
			if (textStatus == 'success' && data.id == 'getinfo') {
				appPort.postMessage({
					'dataUpdate': 'getinfo',
					'data': data.result,
					'textStatus': textStatus
				});
				callback(true);
			}
			else {
				callback({'error': 'Unknown error occurred', 'details': [data, textStatus]});
			}
		});
	};
	api['connect to RPC'] = api['update info'];

	var allowedRPCAPICalls = [
		'backupwallet',
		'getaccount',
		'getaccountaddress',
		'getaddressesbyaccount',
		'getbalance',
		'getblockbycount',
		'getblockcount',
		'getblocknumber',
		'getconnectioncount',
		'getdifficulty',
		'getgenerate',
		'gethashespersec',
		'getinfo',
		'getnewaddress',
		'getreceivedbyaccount',
		'getreceivedbyaddress',
		'gettransaction',
		'getwork',
		'help',
		'listaccounts',
		'listreceivedbyaccount',
		'listreceivedbyaddress',
		'listtransactions',
		'move',
		'sendfrom',
		'sendtoaddress',
		'setaccount',
		'setgenerate',
		'stop',
		'validateaddress'
	];
	var RPCApi = function (method, params, callback) {
		console.log('RPC Api Call: ', method, params);
		if (typeof params != 'array' && typeof params == 'object') {
			var arr = [];
			for (var i in params) {
				arr.push(params[i]);
			}
			params = arr;
		}

		JSONRPC(method, function (data, textStatus) {
			callback(data.result);
		}, params);
	};

	
	var JSONRPC = function (method, callback, params) {
		var url = appSettings.rpcssl ? 'https://' : 'http://';
		url += appSettings.rpcserver + ':' + appSettings.rpcport + '/';

		var options = {
			url: url,
			username: appSettings.rpcuser,
			password: appSettings.rpcpass,
			data: JSON.stringify({
				'method': method,
				'params': params || [],
				'id': method
			}),
			success: callback,
			error: function (jqXHR, textStatus, errorThrown) {
				RPCErrorCallback(textStatus, callback, errorThrown);
			},
			type: 'POST'
		};

		$.ajax(options);
	};

	return new SafebitBase;
}(jQuery));

