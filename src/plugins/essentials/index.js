/**
 * Automatically emits 'message:info' events for 'interesting' Steam events.
 */
exports.name = 'moonrise-essentials';

exports.plugin = function (API) {
  var log = API.getLogger();
  var Steam = API.getSteam();
  var steamFriends = API.getHandler('steamFriends');
  var utils = API.getUtils();

  API.registerHandler({emitter: 'steamFriends', event: 'friend'}, friend);
  API.registerHandler({emitter: 'steamFriends', event: 'group'}, group);
  API.registerHandler({emitter: 'steamFriends', event: 'relationships'}, relationships);
  API.registerHandler({emitter: 'steamUser', event: 'tradeOffers'}, tradeOffers);
  API.registerHandler({emitter: 'steamTrading', event: 'tradeProposed'}, tradeProposed);

  function friend (user, type) {
    if (type === Steam.EFriendRelationship.RequestRecipient) {
      log.info('User %s added me.', user);
    } else if (type === Steam.EFriendRelationship.None) {
      log.info('User %s is no longer in my friends list.', utils.getUserDescription(user));
    }
  }

  function group (groupID, type) {
    if (type === Steam.EClanRelationship.Invited) {
      log.info('I was invited to group: %s.', groupID);
    }
  }

  function relationships () {
    for (var user in steamFriends.friends) {
      if (steamFriends.friends[user] === Steam.EFriendRelationship.RequestRecipient) {
        log.info('New user (%s) added me while I was offline.', user);
      }
    }
  }

  function tradeOffers (number) {
    log.info('Number of trade offers has changed: %d', number);
  }

  function tradeProposed (tradeID, steamID) {
    log.info('I have received a trade request from: %s.', utils.getUserDescription(steamID));
  }
};
