
var Template = (function ($) {
	var TemplateError = function (e) {
		console.log('Error: ', e);
	};
	
	var simpleCache = {};
	
	// TODO: Clean up for templates when destroyed 
	var Template = function Template(name) {
		if (simpleCache.hasOwnProperty(name)) return simpleCache[name];
		if (!(this instanceof Template)) return new Template(name);
		
		var tplEl = $('#' + name + '-template');
		if (tplEl.length == 0) {
			throw new TemplateError('Unable to find template ' + name);
		}
		
		this.orig = tplEl;
		this.el = $(tplEl.text());
		this.selfClass = tplEl[0].className;
	}
	
	return Template;
}(jQuery));

var _temp_SafebitUI = SafebitUI;

var SafebitUI;
SafebitUI = (function($){
	var self = null,
		port,
		_temp_regs = _temp_SafebitUI || [];
	
	function SafebitUI () {
		if (!self) {
			self = this;
		} else {
			return self;
		}
		
		this.init();
	}
	
	// API is the "public" methods of SafebitUI
	var api = {};
	api.updateInterval = 1000*5;
	api.data = {};
	api.activeSection = null;
	api.activeSubSection = null;
	api.status = {
		rpc: false,
		cloud: false,
		bitcoin: false
	};
	api.sections = {};
	api.initializers = {};
	
	api.init = function () {
		if (self.initialized)
			return "Already initialized";
		
		
		self.initialized = true;
		self.domReady = false;
		
		
		// Check if there are any sections registiered before initilization
		var domReadyFuncs = [];

		for (i in _temp_regs) {
			
			var reg = _temp_regs[i];
			if (typeof reg == 'function') {
				var reg = reg();
			}
			
			if (!(typeof reg == 'object')) continue;
			
			if (reg.type == 'section' && reg.name != '') {
				self.registerSection(reg);
			}
			else if (reg.type == 'init' && typeof reg.init == 'function') {
				reg.init.call(self);
			}
		}

		// Initialize Port Connection to Base
		port = chrome.extension.connect({name: "SafebitBase"});
		port.onMessage.addListener(baseCall);

		this.port = port;

		// This will on DOM load event
		$(function() {
			self.domReady = true;
			registerNavigation();
			self.baseCall('getSettings', settingsReady);
			$(self).trigger('domready');
		});
		
		
		function settingsReady (settings) {
			self.setAppSettings(settings);
			
			if (!self.activeSection) {
				if (!settings.rpcuser || !settings.rpcpass) {
					// First time
					self.navigateTo('settings');
				} else {
					self.navigateTo('dashboard');
				}
			}
			
			self.checkRpcServer();		
			$(self).trigger('init');
		}
		
		self.setStatus('rpc', '', 'No connection', self.checkRpcServer);
	};

	api.appSettings = {};
	api.setAppSettings = function (settings) {
		$.extend(self.appSettings, settings);
	};

	/**
	 * Create a call to Base (background page or worker) with a custom callback
	 * and params
	 *
	 * @param action string Any action that the Base will understand
	 * @param callback function A function to fire when Base returns answer
	 * @param params mixed Parameters to send with the request
	 */
	api.baseCall = function (action, callback, params) {
		
		
		chrome.extension.sendRequest({'action': action, 'params': params}, function (result) {
			if (typeof result == 'object' && result != null && result.hasOwnProperty('error')) {
				console.error('Base Call Error: ', result.error, result.details);
			}
			if (typeof callback == 'function') callback(result);
		});
	};
	
	api.registerSection = function (options) {
		var baseOptions = {
			name: '',
			section: '',
			init: function (section) {},
			destroy: function (section) {},
			show: function (section) {},
			beforeShow: function (section) {},
			reload: function () {},
			active: false
		};
		
		var s = $.extend({}, baseOptions, typeof options == 'string' ? {name: options} : options); 
		if (!s.name) {
			throw new Exception ('Name must exist for a section');
		}
		
		if (!self.sections.hasOwnProperty(s.name)) {
			// Create the <section> tag
			self.sections[s.name] = s;
			
			s.template = Template(s.name);
			s.el = section = $('<section/>')
				.attr('id', s.name)
				.appendTo('#content')
				.addClass(s.active ? 'active' : '')
				.addClass(s.template.selfClass)
				.append(s.template.el);
			
			
			s.self = self;
			s.el.data('section', s);
			
			// fire up the section.init function
			s.init.call(self, section);
			
			if (s.active) {
				activateSection(s.name);
			}
		}
		
		return section;
	};
	
	api.registerInit = function (options) {
		var baseOptions = {
			name: '',
			init: function (section) {}
		};
		
		var s = $.extend({}, baseOptions, typeof options == 'string' ? {name: options} : options); 
		if (!s.name) {
			throw new Exception ('Name must exist for a section');
		}
		
		
		if (!self.initializers.hasOwnProperty(s.name)) {
			self.initializers[s.name] = s;
			
			// fire up the init function
			s.init.call(self);
		}
		
	}
	
	/**
	 * Navigate to a section in the app
	 * 
	 * TODO: hide current and unload
	 */
	api.navigateTo = function (sectionName, forceReload) {
		if (forceReload) {
			console.log('destroying existing section',self.sections[sectionName]);	
			if (self.sections[sectionName]) {
				self.sections[sectionName].destroy();
				$(self.sections[sectionName].el).remove();
				$(self.sections[sectionName].template.orig).remove();
				delete self.sections[sectionName];
			}
		}

		// Check if we have such a section already
		if (self.sections.hasOwnProperty(sectionName)) {
			// If section exists, just show it
			var section = self.sections[sectionName]; 
			section.beforeShow.call(self, section);
			activateSection(sectionName);
		} else {
			// Request it from server
			
			var contentReady = function (data) {
				$('#content').append(data);
				
				if (!self.sections.hasOwnProperty(sectionName)) {
					self.registerSection(sectionName);
				}
				
				activateSection(sectionName);
			};
			
			$.ajax({
				url: '/view/partial/' + sectionName + '.html',
				dataType: 'html',
				success: contentReady
			});
		}
	};
	
	api._ = {
		'day_full': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
		'day_short': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		'month_full': [
			'January', 'February', 'March', 'April',
			'May', 'June', 'July', 'August',
			'September', 'October', 'November', 'December'
			],
		'month_short': [
			'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
			'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
			],
		'currency': {
			'USD': '$',
			'AUD': '$',
			'CLP': '$',
			'INR': 'INR',
			'CNY': '&#0165;',
			'JPY': '&#0165;',
			'SLL': 'SLL',
			'HUF': 'Ft',
			'CHF': 'CHF',
			'RUB': '&#1088;&#1091;&#1073;',
			'BRL': 'R$',
			'GBP': '&#0163;',
			'PLN': '&#0122;&#0322;',
			'CAD': '$',
			'SGD': '$',
			'HKD': '$',
			'SEK': 'kr',
			'EUR': '&#8364',
			'THB': '&#3647'
		}
	};

	var checkRpcServerTimeout, checkRpcServerTest = 0;

	/**
	 * This checkRpcServer function manages the notification and details about
	 * connecting to the RPC server.
	 */
	api.checkRpcServer = function () {
		self.setStatus('rpc', 'issue', 'Connecting to RPC server...');
		if (checkRpcServerTimeout) {
			clearTimeout(checkRpcServerTimeout);
		}
		self.status['rpc'] = false;
		self.status['bitcoin'] = false;
		self.baseCall('connect to RPC', function (result) {
			if (typeof result == 'boolean') {
				if (result) {
					$.jGrowl('Connected to RPC Server successfully');
					var statusText = 'Server: '+self.appSettings.rpcserver;

					self.setStatus('rpc', 'idle', statusText);
					self.status['rpc'] = true;
					self.status['bitcoin'] = true;

					$(self).trigger('rpcConnect');
				} else {
					++checkRpcServerTest;
					$.jGrowl('Error connecting to JSON-RPC server, trying again in a moment...<br/>Test #' + checkRpcServerTest);
					self.setStatus('rpc', '', 'No connection', self.checkRpcServer);

					if (checkRpcServerTest >= 5) {
						checkRpcServerTimeout = setTimeout(self.checkRpcServer, 1000 * 60 * (checkRpcServerTest / 5));
						if (checkRpcServerTest >= 10) {
							checkRpcServerTest = 0;
						}
					} else {
						checkRpcServerTimeout = setTimeout(self.checkRpcServer, 1000 * checkRpcServerTest);
					}
				}
			} else {
				var conMessage = 'Unable to connect to RPC server ' + self.appSettings.rpcserver + ' port: ' + self.appSettings.rpcport;
				if (!checkRpcServerTest) {
					$.jGrowl(conMessage);
					console.error('Error trying to connect to RPC server: ', self.appSettings.rpcserver, ' port: ', self.appSettings.rpcport);
				}
				else if (checkRpcServerTest > 2) {
					conMessage += "<br/>Reached maximum number of tries, visit the `Settings` tab to configure your Bitcoin JSON-RPC Server or click the `Network` icon to try again.";
					$.jGrowl(conMessage);
					self.setStatus('rpc', '', 'No connection - Click to reconnect', self.checkRpcServer);
					checkRpcServerTest = 0;
					return false;
				}
				console.log('Settings timeout to try again in ' + checkRpcServerTest + ' seconds again.');
				++checkRpcServerTest;
				checkRpcServerTimeout = setTimeout(self.checkRpcServer, 1000 * checkRpcServerTest);
			}
			
		});
	};

	api.setStatus = function (name, state, text, callback) {
		if (!name) return false;

		var item = $('#status p.' + name);
		if (item.length < 1) return false;

		item.unbind('click');
		if (typeof callback == 'function') item.bind('click', callback);

		item.removeClass('idle active issue');
		if (state) item.addClass(state);

		if (text) $('span', item).html(text);

		return self.setStatus;
	};

	api.utils = {
		numberFormat: function (number, percision, commas, prefix, suffix) {
			number = parseFloat(number);
			if (!percision) percision = 4;
			number = number.toFixed(percision);
			
			if (commas || typeof commas == 'undefined') number = self.utils.numberAddCommas(number);
			if (prefix) number = prefix + '' + number;
			if (suffix) number = number + '' + suffix;
			return number;
		},
		numberAddCommas: function (nStr) {
			nStr += '';
			x = nStr.split('.');
			x1 = x[0];
			x2 = x.length > 1 ? '.' + x[1] : '';
			var rgx = /(\d+)(\d{3})/;
			while (rgx.test(x1)) {
				x1 = x1.replace(rgx, '$1' + ',' + '$2');
			}
			return x1 + x2;
		},
		toNumber: function (str) {
			str += '';
			var rgx = /^\d|\.|-$/;
			var out = '';
			for (var i = 0; i < str.length; i++) {
				if (rgx.test(str.charAt(i))) {
					if (!( ( str.charAt(i) == '.' && out.indexOf('.') != -1 ) ||
							( str.charAt(i) == '-' && out.length != 0 ) )) {
						out += str.charAt(i);
					}
				}
			}
			return out;
		}

	};
	
	api.activateSubSection = function (subName, section) {
		$('article', section).removeClass('active');
		$('article.'+subName, section).addClass('active');
		$('nav li', section).removeClass('active');
		$('nav li.'+subName, section).addClass('active');
		
		self.activeSubSection = subName;
		$(self).trigger('subSectionChanged', [subName]);
	};

	
	// Below are the private functions

	var baseCall = function (msg) {
		if (typeof msg == 'object' && msg.hasOwnProperty('dataUpdate')) {
			self.data[msg.dataUpdate] = msg.data;
			triggerDataUpdate(msg.dataUpdate, msg.data);
		}
	};

	var registerNavigation = function () {
		var binds = {
			'click': function (event) {
				var rel = $(this).attr('rel'),
					container = $(this).parents('.sidemenu');
					
				if (container.length == 0) {
					// This is not a sidemenu link
					self.navigateTo(rel, event.shiftKey);
				} else {
					rel = $('a', this).attr('rel');
					self.activateSubSection(rel, container);
				}
			}
		};
		
		var prepareNavEl = function (index, el) {
			var $el = $(el),
				rel = $('a[rel]', el).attr('rel') || null;
				
			if (!rel) {
				// <a> does not have 'rel=""' attribute, ignoreing
				$(el).addClass('no-rel');
				return;
			}
			
			var $a = $('a', el);
			
			$a.live(binds);
			if ($el.hasClass('active')) {
				$('a', $el).trigger('click');
			}
		}
		
		$('#main-nav li').each(prepareNavEl);
		$('.sidemenu nav li').live(binds);
		
		$('.section-nav').live('click', function (event) {
			var container = $(this).parents('.sidemenu'),
				rel = $(this).attr('rel');
				console.log('Section nav clicked, rel: ', rel);
				
			self.activateSubSection(rel, container);
			
			// $('article', container).removeClass('active');
			// $('article.'+rel, container).addClass('active');
			// $('nav li', container).removeClass('active');
			// $('nav li a[rel="'+rel+'"]', container).parent().addClass('active');
		});
	}
	
	/**
	 * Change the section to a new sction (must exists already)
	 * 
	 * @param sectioName string
	 */
	var activateSection = function (sectionName) {
		var curSection = $('#content section.active').data('section') || false;
			
		$('#main-nav li.active').removeClass('active');
		$('#main-nav li.' + sectionName).addClass('active');
		$('#content section.active').removeClass('active').addClass('hidden');
		$('#content section#' + sectionName).addClass('active').removeClass('hidden');
		
		self.activeSection = sectionName;
		$(self).trigger('sectionChanged');
	};

	/**
	 * Trigger a dataUpdate event for SafebitUI
	 * @param dataId string Data ID (e.g. `getinfo`)
	 * @param data mixed Data
	 */
	var triggerDataUpdate = function (dataId, data) {
		$(self).trigger('dataUpdate', [dataId, data]);
	};
	
	
	var flickerRpcStatus = function () {
		
	}
	
	// Radio list handling
	$('.radio-list label').live('click', function(event) {
		var $label = $(this),
			$input = $('input', $label);
		
		if ($input.is(':checked')) {
			$label.siblings().removeClass('selected checked');
			$label.addClass('selected checked');
		}
	})
	
	
	$.extend(SafebitUI.prototype, api);
	// on DOM load init SafebitUI
	return new SafebitUI;
	
}(jQuery));
