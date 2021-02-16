var PlayerUiComponent = IgeEntity.extend({
	classId: 'PlayerUiComponent',
	componentId: 'playerUi',

	init: function (entity, options) {
		var self = this;
		self._entity = entity;

		self.setupListeners();
		self.pressedButton = false;

		self.lastInputValue = '';
		self.dialogue = {
			message: null,
			messagePrinter: null
		};
	},

	setupListeners: function () {
		//listeners for player input modal
		var self = this;

		$('#player-input-modal').on('hidden.bs.modal', function () {
			if (self.pressedButton) {
				ige.network.send('playerCustomInput', { status: 'submitted', inputText: self.lastInputValue });
				self.lastInputValue = '';
			}
			else {
				ige.network.send('playerCustomInput', { status: 'dismissed' });
			}

			$("#player-input-modal").removeClass('d-flex');
		});

		$('#custom-modal').on('hidden.bs.modal', function () {
			$("#custom-modal").removeClass('d-flex');
		});

		$('#custom-modal').on('shown.bs.modal', function () {
			$("#custom-modal-cancel").focus();
		});

		$('#player-input-modal').on('shown.bs.modal', function () {
			if (self.isDismissibleInputModalShown) {
				$("#player-input-cancel").focus();
			}
			else {
				$("#player-input-field").focus();
			}
		});

		$('button#player-input-submit').on('click', function () {
			self.lastInputValue = $('#player-input-field').val();
			self.pressedButton = true;
			$('#player-input-modal').modal('hide');
		});

		$('button#player-input-cancel').on('click', function () {
			self.pressedButton = false;
			ige.network.send('playerCustomInput', { status: 'cancelled' });
			$('#player-input-modal').modal('hide');
		});
	},

	updatePlayerAttributesDiv: function (attributes) {
		var self = this;

		$("#players-attribute-div").html("");
		var attributeTypes = ige.game.data.attributeTypes;

		if (attributeTypes == undefined)
			return;

		for (var attrKey in attributes) {

			var attr = attributes[attrKey];
			if (attr) {
				if (!attr.isVisible) continue;

				var attributeType = attributeTypes[attrKey];
				var name = attributeType ? attributeType.name : attr.name;


				var attrName = $("<span/>", {
					class: "pt-attribute-" + attrKey
				});
				var attrValue = $("<span/>", {
					class: "pt-attribute-value-" + attrKey
				});
				$("#players-attribute-div").append(
					attrName
				).append(
					attrValue
				).append($("<br/>"));
				attrName.text(name + ": ");

				// if attr value is int, then do not show decimal points. otherwise, show up to 2 decimal points
				if (attr.value % 1 === 0) {
					attr.value = parseInt(attr.value)
				}
				else {
					if (attr.decimalPlaces != undefined && attr.decimalPlaces != null) {
						var decimalPlace = parseInt(attr.decimalPlaces);
						if (decimalPlace != NaN) {
							attr.value = parseFloat(attr.value).toFixed(decimalPlace)
						}
						else {
							attr.value = parseFloat(attr.value).toFixed(2)
						}
					}
					else {
						attr.value = parseFloat(attr.value).toFixed(2)
					}
				}

				var value = attr.value && attr.value.toLocaleString('en-US') || 0;
				attrValue.text(value);
			}
			
		}

		//update shop as player points are changed and when shop modal is open
		if ($('#modd-item-shop-modal').hasClass('show')) {
			ige.shop.openItemShop();
		}
	},

	updatePlayerCoin: function (newValue) {
		var coin = parseInt($('.player-coins').html());
		if (coin != NaN) {
			$('.player-coins').html(parseInt(newValue));
		}
	},

	showFriendsModal: function (config) {
		$("#invite-friends-modal").modal('show');
	},

	// open a modal to ask for input
	showInputModal: function (config) {
		var self = this;

		config.isDismissible = config.isDismissible === undefined ? true : !!(config.isDismissible);
		self.isDismissibleInputModalShown = config.isDismissible;

		$('#player-input-field-label').html(config.fieldLabel || 'Field');
		$('#player-input-field').val('');
		$("#player-input-modal").addClass('d-flex');
		$("#player-input-modal").modal({
			backdrop: config.isDismissible ? true : 'static',
			keyboard: config.isDismissible
		});

		if (config.isDismissible) {
			$('#player-input-cancel-container').show();
			$('#player-input-modal-dismiss-button').show();
		}
		else {
			$('#player-input-cancel-container').hide();
			$('#player-input-modal-dismiss-button').hide();
		}

		$("#player-input-modal").modal('show');

		self.pressedButton = false;
	},

	// open a modal with custom content rendered in it
	showCustomModal: function (config) {
		var self = this;

		config.isDismissible = config.isDismissible === undefined ? true : !!(config.isDismissible);

		$('#custom-modal .content').html(config.content || '');

		if (config.title) {
			$('#custom-modal .modal-title').html(config.title);
			$('#custom-modal .modal-header').show();
		}
		else {
			$('#custom-modal .modal-header').hide();
		}

		$("#custom-modal").addClass('d-flex');
		$("#custom-modal").modal({
			backdrop: config.isDismissible ? true : 'static',
			keyboard: config.isDismissible
		});

		if (config.isDismissible) {
			$('#custom-modal-cancel-container').show();
			$('#custom-modal-dismiss-button').show();
		}
		else {
			$('#custom-modal-cancel-container').hide();
			$('#custom-modal-dismiss-button').hide();
		}

		$("#custom-modal").modal('show');

		self.pressedButton = false;
	},

	// open a modal with custom content rendered in it
	openWebsite: function (config) {
		var self = this;

		config.isDismissible = config.isDismissible === undefined ? true : !!(config.isDismissible);
		var newWin = window.open(config.url);

		if (!newWin || newWin.closed || typeof newWin.closed == 'undefined') {
			swal({
				title: "Please allow Popups",
				text: "Your browser is blocking the content modd.io is trying to display",
				imageWidth: 300,
				imageUrl: '/assets/images/enable-popup.gif',
				imageClass: 'rounded border'
			});
		}
	},
	showWebsiteModal: function (config) {
		var self = this;

		config.isDismissible = config.isDismissible === undefined ? true : !!(config.isDismissible);

		$("#website-modal").find('iframe').attr('src', config.url);
		$("#website-modal").modal({
			backdrop: config.isDismissible ? true : 'static',
			keyboard: config.isDismissible
		});
	},
	showSocialShareModal: function (config) {
		var self = this;

		config.isDismissible = config.isDismissible === undefined ? true : !!(config.isDismissible);

		$("#social-share-modal").modal({
			backdrop: config.isDismissible ? true : 'static',
			keyboard: config.isDismissible
		});
	},

	openDialogueModal: function (dialogueId, extraData) {
		var self = this;

		function getDialogueInstance(dialogue) {
			var playerName = extraData && extraData.playerName;
			dialogue = JSON.parse(JSON.stringify(dialogue));

			if (dialogue.message.indexOf('%PLAYER_NAME%') > -1 && playerName) {
				dialogue.message = dialogue.message.replace(/%PLAYER_NAME%/g, playerName);
			}

			var variables = dialogue.message.match(new RegExp('\\$.+?\\$', 'g'));

			if (variables && variables.length) {
				variables.forEach(function (variable) {
					// variable are in format $xxx$ so splitting it by $ will give ['', 'xxx', '']
					var variableName = variable.split('$')[1];

					if (extraData.variables.hasOwnProperty(variableName)) {
						var variableValue = extraData.variables[variableName];

						// replace all occurrences of variableName
						dialogue.message = dialogue.message.replace(new RegExp('\\$' + variableName + '\\$', 'g'), variableValue);
					}
				});
			}

			dialogue.messageFragments = dialogue.message.split('%br%');
			dialogue.currentFragmentIndex = 0;
			dialogue.areAllMessagesPrinted = function () {
				return this.currentFragmentIndex >= this.messageFragments.length;
			}
			dialogue.getNextMessage = function () {
				return dialogue.messageFragments[dialogue.currentFragmentIndex++];
			}
			dialogue.hasOptions = function () {
				return Object.keys(dialogue.options).length > 0;
			}
			dialogue.areOptionsRendered = false;

			return dialogue;
		}

		function initModal() {
			$('#modd-dialogue-message').html('');
			$('#modd-dialogue-image').attr('src', '');
			$('#modd-dialogue-options-container').addClass('d-none');
			$('#modd-dialogue-skip-hint').addClass('d-none');

			if (self.dialogue.messagePrinter) {
				clearInterval(self.dialogue.messagePrinter);
			}

			if (dialogue.image) {
				$('#modd-dialogue-image-container').removeClass('d-none');
				$('#modd-dialogue-message-container').addClass('col-8');
				$('#modd-dialogue-message-container').addClass('pl-md-0');
				$('#modd-dialogue-message-container').removeClass('col-12');
				$('#modd-dialogue-image').attr('src', dialogue.image);
			}
			else {
				$('#modd-dialogue-image-container').addClass('d-none');
				$('#modd-dialogue-message-container').removeClass('col-8');
				$('#modd-dialogue-message-container').addClass('col-12');
				$('#modd-dialogue-image').attr('src', '');
			}

			$(document).on('keydown.modd-dialogue', keyboardListener);
			$(document).on('click.modd-dialogue', skipText);
		}

		function printingCompleted() {
			window.isPrintingDialogue = false;

			if (dialogue.areAllMessagesPrinted()) {
				if (dialogue.hasOptions()) {
					if (!dialogue.areOptionsRendered) {
						showOptions();
					}
				}
				else {
					$('#modd-dialogue-skip-hint').removeClass('d-none');
				}
			}
			else {
				$('#modd-dialogue-skip-hint').removeClass('d-none');
			}
		}

		function showOptions() {
			$('#modd-dialogue-options').html('');

			for (var key in dialogue.options) {
				var optionObject = dialogue.options[key];
				var button = $('<button/>', {
					id: key,
					class: 'btn btn-light border btn-block text-left dialogue-option-button',
					click: function () {
						var optionId = this.id;
						$('.dialogue-option-button').addClass('disabled');
						$(this).find('.fa-check').removeClass('d-none');
						ige.playerUi.submitDialogueModal(dialogueId, optionId);
					}
				});

				button.append($('<i/>', { class: 'd-none fa fa-check mr-2' }));
				button.append($('<span/>', { text: optionObject.name }))

				$('#modd-dialogue-options').append(button);
			}

			$('#modd-dialogue-skip-hint').addClass('d-none');
			$('#modd-dialogue-options-container').removeClass('d-none');

			dialogue.areOptionsRendered = true;
		}

		function showNextMessage() {
			if (dialogue.areAllMessagesPrinted()) {
				if (dialogue.hasOptions()) {
					if (!dialogue.areOptionsRendered) {
						showOptions();
					}
				}
				else {
					self.closeDialogueModal();
				}
			}
			else {
				self.dialogue.message = dialogue.getNextMessage();
				self.dialogue.message = self.dialogue.message.replace(/%nl%/g, '<br/>');
				window.isPrintingDialogue = true;
				$('#modd-dialogue-message').html('');
				$('#modd-dialogue-skip-hint').addClass('d-none');
				self.dialogue.messagePrinter = $('#modd-dialogue-message').length && $('#modd-dialogue-message')
					.writeText(self.dialogue.message, dialogue.letterPrintSpeed, printingCompleted);
			}
		}

		function skipText() {
			if (window.isPrintingDialogue) {
				clearInterval(self.dialogue.messagePrinter);
				$('#modd-dialogue-message').html(self.dialogue.message);
				$('#modd-dialogue-skip-hint').removeClass('d-none');
				window.isPrintingDialogue = false;

				// if 
				// 1. user skips text in last fragment and
				// 2. dialogue has options and
				// 3. those options are still hidden 
				// then direct render the options dont ask user for one more action

				if (dialogue.areAllMessagesPrinted() && dialogue.hasOptions() && !dialogue.areOptionsRendered) {
					showOptions();
				}
			}
			else {
				showNextMessage();
			}
		}

		function keyboardListener(e) {
			if (e.keyCode === 13 || e.keyCode === 32) {
				e.stopPropagation();
				skipText();
			}
		}

		var dialogue = ige.game.data.dialogues[dialogueId];

		if (dialogue) {
			dialogue = getDialogueInstance(dialogue);
			initModal();
			showNextMessage();

			$('#modd-dialogue-modal').modal('show');
		}
		else {
			console.error('dialogue', dialogueId, 'not found');
		}
	},

	closeDialogueModal: function () {
		$('#modd-dialogue-message').html('');
		$('#modd-dialogue-options-container').addClass('d-none');
		$('#modd-dialogue-image').attr('src', '');
		$('#modd-dialogue-modal').modal('hide');

		this.clearListeners();
	},

	clearListeners: function () {
		console.log('clearing all keydown listeners on document');
		$(document).off('click.modd-dialogue keydown.modd-dialogue');
	},

	submitDialogueModal: function (dialogueId, optionId) {
		var self = this;
		var willOpenNewDialogue = false;
		var dialogue = ige.game.data.dialogues[dialogueId];

		for (var key in dialogue.options) {
			if (key === optionId) {
				willOpenNewDialogue = !!dialogue.options[key].followUpDialogue;
				break;
			}
		}

		if (willOpenNewDialogue) {
			this.clearListeners();
		}
		else {
			self.closeDialogueModal();
		}

		if (dialogueId && optionId) {
			ige.network.send('playerDialogueSubmit', {
				status: 'submitted',
				dialogue: dialogueId,
				option: optionId
			});
		}
	}
});


if (typeof (module) !== 'undefined' && typeof (module.exports) !== 'undefined') { module.exports = PlayerUiComponent; }