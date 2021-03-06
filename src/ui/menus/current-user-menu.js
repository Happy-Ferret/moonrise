var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;

var UserActions = require('../../actions/user-actions.js');
var UIActions = require('../../actions/ui-actions.js');

module.exports = function (user) {
  var menu = new Menu();

  function appendStateOptionToMenu (label, state) {
    var type = (state === user.stateEnum) ? 'checkbox' : 'normal';
    var checked = state === user.stateEnum;

    menu.append(new MenuItem({
      label: label,
      click: function () {
        UserActions.changeState(state);
      },
      type: type,
      checked: checked
    }));
  }

  appendStateOptionToMenu('Online', 1);
  appendStateOptionToMenu('Away', 3);
  appendStateOptionToMenu('Busy', 2);
  appendStateOptionToMenu('Looking to Play', 6);
  appendStateOptionToMenu('Looking to Trade', 5);
  appendStateOptionToMenu('Snooze', 4);
  appendStateOptionToMenu('Offline', 0);

  menu.append(new MenuItem({type: 'separator'}));

  menu.append(new MenuItem({
    label: 'Change name',
    click: function () {
      UIActions.changeNameOpenDialog();
    }
  }));

  return menu;
};
