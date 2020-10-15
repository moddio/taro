var TradeUiComponent = IgeEntity.extend({
    classId: 'TradeUiComponent',
    componentId: 'tradeUi',

    init: function (entity, options) {
        var self = this;

        $('#accept-trade-request-button').on('click', function () {
            var requestedBy = $('#requested-by').text();
            var acceptedBy = ige.client.myPlayer.id();
            ige.network.send('trade', { type: 'start', requestedBy: requestedBy, acceptedBy: acceptedBy });
            $('#trade-request-div').hide();
            ige.tradeUi.startTrading(ige.client.myPlayer, ige.$(requestedBy));
        });

        $('#accept-trade-button').on('click', function () {
            ige.network.send('trade', {
                type: 'accept',
                acceptedBy: ige.client.myPlayer.id(),
                acceptedFor: ige.client.myPlayer.tradingWith,
            });
        });

        $('.cancel-trade-request-button').on('click', function () {
            // ige.network.send('trade', { type: 'cancel' });
            ige.tradeUi.closeTradeRequest();
        });

        $('.cancel-trade-button').on('click', function () {
            // ige.network.send('trade', { type: 'cancel' });
            ige.tradeUi.closeTrading();
        });
    },

    initiateTradeRequest: function (player) {
        var message = player._stats.name + ' wants to trade with you. Trade?';
        $('#requested-by').text(player.id());
        $('#trade-request-message').text(message);
        $('#trade-request-div').show();
    },
    clearOfferSlots: function () {
        var offerSlots = $('#offer-trading-slots');
        offerSlots.html('');
        var i = 1;
        while (i < 6) {
            offerSlots.append(
                $('<div/>', {
                    id: 'offer-' + i,
                    class: 'btn btn-light trade-offer-slot',
                }),
            );
            i++;
        }
    },

    startTrading: function (playerA, playerB) {
        if (playerA !== ige.client.myPlayer) {
            $('#trader-name').text(playerA._stats.name);
        } else if (playerB !== ige.client.myPlayer) {
            $('#trader-name').text(playerB._stats.name);
        }
        playerA.tradingWith = playerB.id();
        playerB.tradingWith = playerA.id();
        playerA.isTrading = true;
        playerB.isTrading = true;

        this.clearOfferSlots();
        $('#trade-div').show();
    },
    sendOfferingItems: function () {
        var selectedUnit = ige.client.myPlayer.getSelectedUnit();
        var totalInventorySlot = selectedUnit.inventory.getTotalInventorySize();
        var tradeItems = [];
        var id = 0;
        for (var i = totalInventorySlot; i < totalInventorySlot + 5; i++) {
            tradeItems[id++] = selectedUnit._stats.itemIds[i];
        }
        ige.network.send('trade', {
            type: 'offer',
            from: ige.client.myPlayer.id(),
            to: ige.client.myPlayer.tradingWith,
            tradeItems: tradeItems,
        });
    },
    receiveOfferingItems: function (tradeItems) {
        for (var i = 0; i < tradeItems.length; i++) {
            var index = i + 1;
            var itemId = tradeItems[i];
            var item = ige.$(itemId);
            $('#offer-' + index).html('');
            if (itemId && item && item._category === 'item') {
                var itemDiv = ige.itemUi.getItemDiv(item, {
                    isDraggable: false,
                    popover: 'top',
                    isTrading: true,
                });
                $('#offer-' + index).html(itemDiv);
            }
        }
    },
    closeTradeRequest: function () {
        $('#trade-request-div').hide();
    },

    closeTrading: function () {
        var playerA = ige.client.myPlayer;
        var playerB = ige.$(ige.client.myPlayer.tradingWith);
        ige.network.send('trade', { type: 'cancel', cancleBy: playerA.id(), cancleTo: playerB.id() });
        delete playerA.tradingWith;
        delete playerB.tradingWith;
        delete playerA.isTrading;
        delete playerB.isTrading;
        $('#trade-div').hide();
    },
});

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = TradeUiComponent;
}
