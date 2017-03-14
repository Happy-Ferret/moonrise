const classNames = require('classnames');
const React = require('react');

const ChatActions = require('../../actions/chat-actions.js');
const FriendsStore = require('../../stores/friends-store.js');

const Tab = React.createClass({
  propTypes: {
    chat: React.PropTypes.object.isRequired
  },

  _onClick: function (evt) {
    evt.stopPropagation();
    ChatActions.switchChat(this.props.chat);
  },

  _onClose: function (evt) {
    evt.stopPropagation();
    ChatActions.closeChat(this.props.chat);
  },

  _getStateClassName: function () {
    const user = this.state.friend;

    if (!user || !user.stateEnum) {
      return 'offline';
    }

    if (user.inGame) {
      return 'in-game';
    }

    switch (user.stateEnum) {
      case 0:
        return 'offline';
      default:
        return 'online';
    }
  },

  _onChange: function () {
    this.setState({friend: FriendsStore.getById(this.props.chat.id)});
  },

  getInitialState: function () {
    return {friend: FriendsStore.getById(this.props.chat.id)};
  },

  componentDidMount: function () {
    FriendsStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function () {
    FriendsStore.removeChangeListener(this._onChange);
  },

  render: function () {
    var tabClassName = classNames('tab-item', {'active': this.props.chat.visible});
    var onlineStateClassName = classNames('fa', 'fa-circle', this._getStateClassName());

    var tabTitle = this.props.chat.unreadMessageCount > 0 ? '(' + this.props.chat.unreadMessageCount + ') ' : '';
    tabTitle += this.state.friend ? this.state.friend.username : '';

    return (
      <div className={tabClassName} onClick={this._onClick} title={tabTitle}>
        <span className="icon icon-cancel icon-close-tab" onClick={this._onClose}></span>
        <i className={onlineStateClassName}></i>
        {' '}
        {tabTitle}
      </div>
    );
  }
});

module.exports = Tab;
