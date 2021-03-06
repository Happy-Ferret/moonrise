var Constants = require('../../constants');
var Dispatcher = require('../../dispatcher');
var ChatActions = require('../../actions/chat-actions.js');
var ChatStore = require('../../stores/chat-store.js');

var SteamCommunityWindow = require('../../ui/windows/steam-community.js');

/**
 * Trade
 * Handles sending, receiving, accepting, declining and cancelling trade requests.
 */
exports.name = 'moonrise-trade';

exports.plugin = function (API) {
  var Steam = API.getSteam();
  var log = API.getLogger();
  var utils = API.getUtils();
  var steamFriends = API.getHandler('steamFriends');
  var steamTrading = API.getHandler('steamTrading');

  var callbacks = {};

  callbacks[Steam.EMsg.EconTrading_InitiateTradeProposed] = function (body) {
    var response = Steam.Internal.CMsgTrading_InitiateTradeRequest.decode(body);
    log.debug('Received trade request %s from %s.', response.trade_request_id, response.other_steamid);

    // Steam sends us trade requests from anyone, even people who are not on our friends list.
    if (steamFriends.friends[response.other_steamid] !== Steam.EFriendRelationship.Friend) {
      return;
    }

    // `response.other_name` is always null so we use `personaStates`, if possible.
    var username = response.other_steamid;
    var persona = steamFriends.personaStates[response.other_steamid];
    if (persona) {
      username = persona.player_name;
    }

    // Trade request is just a special type of message with extra metadata.
    var message = {
      type: Constants.MessageTypes.CHAT_THEIR_TRADE_REQUEST,
      sender: response.other_steamid,  // SteamID64 string.
      username: username,              // Display name if possible.
      date: new Date(),
      text: username + ' has invited you to trade items.',
      meta: {
        tradeRequestId: response.trade_request_id
      }
    };

    ChatActions.newIncomingMessage(message);
  };

  // Steam uses this for both incoming (ignored by receiver, cancelled by sender) and outgoing trade requests (accept, decline, etc.).
  // We will NOT receive this message for trade requests which we explicitly accept/decline.
  // Sometimes when the sender cancels their trade request, we still don't receive this message.
  callbacks[Steam.EMsg.EconTrading_InitiateTradeResult] = function (body) {
    var response = Steam.Internal.CMsgTrading_InitiateTradeResponse.decode(body);
    var description = utils.enumToString(response.response, Steam.EEconTradeResponse);

    log.debug('Response to trade request %s: %d (%s).', response.trade_request_id, response.response, description);

    if (response.response === Steam.EEconTradeResponse.Cancel) {
      // we need to decline the trade request for whatever reason
      // this is also how official Steam client does things
      if (response.trade_request_id !== 0) {
        steamTrading.respondToTrade(response.trade_request_id, false);
      } else {
        var tradeRequestId = ChatStore.getLastIncomingTradeRequestId(response.other_steamid);
        if (tradeRequestId) {
          log.debug('Declined cancelled trade request.');
          steamTrading.respondToTrade(tradeRequestId, false);
        }
      }
    }

    var response = {
      response: response.response,
      responseEnum: description,
      tradeRequestId: response.trade_request_id, // this is 0 sometimes
      id: response.other_steamid
    };

    ChatActions.incomingTradeRequestResponse(response);

    // TODO make use of this info
    // steamguard_required_days: 15,
    // new_device_cooldown_days: 7,
    // default_password_reset_probation_days: 5,
    // password_reset_probation_days: null,
    // default_email_change_probation_days: 5,
    // email_change_probation_days: null
  };

  callbacks[Steam.EMsg.EconTrading_StartSession] = function (body) {
    var response = Steam.Internal.CMsgTrading_StartSession.decode(body);
    log.debug('Trading session with %s has started.', response.other_steamid);

    // Must be HTTP; otherwise, 'tradestatus' (and possibly other stuff) does not work.
    SteamCommunityWindow.open('http://steamcommunity.com/trade/' + response.other_steamid);
  };

  var token = Dispatcher.register(function (action) {
    switch(action.type) {
      case Constants.ChatActions.CHAT_RESPOND_TO_TRADE_REQUEST:
        steamTrading.respondToTrade(action.message.meta.tradeRequestId, action.response);
        log.debug('Responded to trade request %s.', action.message.meta.tradeRequestId);
        break;

      case Constants.FriendsActions.FRIENDS_SEND_TRADE_REQUEST:
        steamTrading.trade(action.friend.id);
        log.debug('Sent a trade request to ' + action.friend.username);
        break;

      case Constants.ChatActions.CHAT_CANCEL_TRADE_REQUEST:
        steamTrading.cancelTrade(action.id);
        log.debug('Cancelled trade request sent to %s.', action.id);
        break;

      default:
        // ignore
    }
  });

  API.registerHandler({
    emitter: 'client',
    event: 'message'
  }, function (header, body) {
    if (header.msg in callbacks) {
      callbacks[header.msg](body);
    }
  });

  API.registerHandler({
    emitter: 'plugin',
    plugin: '*',
    event: 'logout'
  }, function () {
    Dispatcher.unregister(token);
  });
};
