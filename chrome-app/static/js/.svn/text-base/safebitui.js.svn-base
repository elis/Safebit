
var Template = (function ($) {
	var TemplateError = function (e) {
		console.log('Error: ', e);
	};
	
	var simpleCache = {};
	
	
	var Template = function Template(name) {
		if (simpleCache.hasOwnProperty(name)) return simpleCache[name];
		if (!(this instanceof Template)) return new Template(name);
		
		var tplEl = $('#' + name + '-template');
		if (tplEl.length == 0) {
			throw new TemplateError('Unable to find template');
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
	api.data = {};
	api.sections = {};
	api.initializers = {};
	
	api.init = function () {
		if (self.initialized)
			return "Already initialized";
		
		self.initialized = true;
		self.domReady = false;
		
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
		
		// This will on DOM load event
		$(function() {
			self.domReady = true;
			registerNavigation();
			$(self).trigger('domready');
		});
		$(self).trigger('init');
	};

	api.registerSection = function (options) {
		var baseOptions = {
			name: '',
			section: '',
			init: function (section) {},
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
	}
	
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
	api.navigateTo = function (sectionName) {
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
			}
			
			$.ajax({
				url: '/?loadPartial=' + sectionName,
				dataType: 'html',
				success: contentReady
			});
		}
	}
	
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
			]
	}
	
	$.extend(SafebitUI.prototype, api);
	
	// Below are the private functions
	
	var registerNavigation = function () {
		var binds = {
			'click': function (event) {
				var rel = $(this).attr('rel'),
					container = $(this).parents('.sidemenu');
					
				if (container.length == 0) {
					self.navigateTo(rel);
				} else {
					rel = $('a', this).attr('rel');
					$('article', container).removeClass('active');
					$('article.'+rel, container).addClass('active');
					$('nav li', container).removeClass('active');
					$(this).addClass('active');
				}
			}
		}
		
		var prepareNavEl = function (index, el) {
			var $el = $(el),
				rel = $('a[rel]', el).attr('rel') || null;
				
			if (!rel) {
				// <a> does not have 'rel=""' attribute, ignoreing
				$(el).addClass('no-rel');
				return;
			}
			
			var $a = $('a', el);
			
			$a.live(binds)
			if ($el.hasClass('active')) {
				$('a', $el).trigger('click');
			}
		}
		
		$('#main-nav li').each(prepareNavEl);
		$('.sidemenu nav li').live(binds);
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
	}
	
	
	// on DOM load init SafebitUI
	return new SafebitUI;
	
}(jQuery));
