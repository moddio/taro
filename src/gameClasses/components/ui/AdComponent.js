var AdComponent = IgeEntity.extend({
	classId: 'AdComponent',
	componentId: 'ad',

	init: function () {
		var self = this
		if (ige.isClient && $('#user-permission-tracker').length) {
			$("body").append($("<div/>", {
				id: "preroll",
				style: "z-index:40000; display: none",
				class: "absolute-center"
			}));
		}

		this.lastPlayedAd = null;
	},

	play: function (data, clientId) {
		if (ige.isServer) {
			ige.network.send("playAd", data, clientId); // update text for all clients
		}
		else if (ige.isClient) {
			// are we running on mobile
			if (ige.mobileControls.isMobile) {
				// on mobile
				var eventData = { 'msg': 'showad' };

				if (window.msgQueue) {
					// running inside modd cordova wrapper
					window.msgQueue.push(eventData);
				}
				else {
					// on mobile web AIP ads not working well
					console.log('adplay req mobile web');
				}

				sendMessageToReactNative(eventData);
			} else {
				// on desktop
				if (isInIFrame) {
					ID.gameBreak(function () {
						// Ad skipped or finished
					})
					return;
				}
				$('#disable-ads-be-our-patron').show();
				if (typeof aipPlayer != "undefined") {
					adplayer = new aipPlayer({
						AD_WIDTH: 960,
						AD_HEIGHT: 540,
						AD_FULLSCREEN: false,
						AD_CENTERPLAYER: false,
						LOADING_TEXT: 'loading advertisement',
						PREROLL_ELEM: document.getElementById('preroll'),
						AIP_COMPLETE: function () {
							// this.prerollComplete();
							$("#preroll").hide()
							$('#disable-ads-be-our-patron').hide();
						},
						AIP_REMOVE: function () { }
					});
					adplayer.startPreRoll(); /* show the preroll */
					$("#preroll").show()
				}
				else {
					setTimeout(() => {
						$('#disable-ads-be-our-patron').hide();
					}, 7000)
				}
			}
		}
	},

	showRewardAd: function () {
		if (window.cpmStarRAd) {
			if (window.cpmStarRAd.isLoaded()) {
				window.cpmStarRAd.show();
			}
			else {
				window.cpmStarRAd.load();
			}
		}
		else {
			console.log('window.cpmStarRAd is not defined', window.cpmStarRAd);
		}
	},

	showAnchorTag: function () {
		if (noAds) {
			return;
		}
	}

});

if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = AdComponent; }