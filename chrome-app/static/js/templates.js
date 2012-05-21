
var Templates = (function ($, Mustache) {
	var TemplateError = function (e) {
		console.log('Error: ', e);
	};
	
	var simpleCache = {};
	
	var Template = function (tpl) {
		this.render = function () {
		}
		
		this.tpl = tpl;
	}
	
	// TODO: Clean up for templates when destroyed 
	var Templates = function (templateName) {
		var $tpl = $('script[data-template-name="' + templateName + '"]'),
			tpl = $tpl.html();
		
		console.log(tpl);
		
		return new Template(tpl);
	}
	
	return Templates;
}(jQuery, Mustache));