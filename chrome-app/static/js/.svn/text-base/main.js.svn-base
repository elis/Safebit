/**
 * 
 * Main (section un-related) bindings
 * 
 */
var mainClientStuff = function() {
	var updateEvery = 1000*60*5;

	var stat = {}, // Static variable to share in here
		self; // reference to SafebitUI instance
	
	var mainDomready = function () {
		var updateWalletSize = function () {
			$.getJSON('/api/getInfo', function (data) {
				var result = data.result;
				
				stat.blockCount.text(result.blocks);
				stat.walletSize.text(result.balance);
			});
			
			setTimeout(updateWalletSize, updateEvery);
		}
		
		stat.blockCount = $('#last-update .block-count');
		stat.walletSize = $('#wallet-size .btc .amount');
		
		updateWalletSize();
	}
	
	var mainInit = function () {
		$(this).bind('domready', mainDomready);
	}
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