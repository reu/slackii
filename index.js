var Slack = require("slack-client");
var ui = require("./ui");

var slack = new Slack(process.argv[2], true, true);

function getChannelByName(name) {
  if (slack.getChannelGroupOrDMByName(name)) {
    return slack.getChannelGroupOrDMByName(name);
  } else if (slack.getUserByName(name)) {
    return slack.getUserByName(name);
  }
}

function fetchHistory(channel, callback) {
  channel._onFetchHistory = function(response) {
    if (response.ok && callback) {
      callback(response.messages.reverse());
    }
  }

  channel.fetchHistory();
}

function populateChannel(channel, callback) {
  fetchHistory(channel, function(messages) {
    messages.forEach(function(message) {
      if (message.type == "message") {
        if (message.subtype === "bot_message") {
          var user = slack.getBotByID(message.bot_id)
        }
        else
          var user = slack.getUserByID(message.user);

        ui.addMessage({
          user: user.name,
          channel: channel.name,
          text: message.text
        });
      }
    });

    if (callback) callback();
  });
}

slack.on("open", function() {
  ui.clear();

  for (var channelId in slack.channels) {
    var channel = slack.channels[channelId];
    if (channel.is_member) {
      ui.addChannel(channel);

      if (channel.name == "general") {
        populateChannel(channel, function() {
          ui.render();
        });
      }
    }
  }

  for (var groupId in slack.groups) {
    var group = slack.groups[groupId];
    ui.addPrivateGroup(group);
  }

  for (var directMessageId in slack.dms) {
    var dm = slack.dms[directMessageId];
    ui.addDirectMessage(dm);
  }
});

ui.on("message", function(message) {
  var channel = getChannelByName(message.channel);
  channel.send(message.text);
  ui.addMessage({
    user: slack.self.name,
    channel: message.channel,
    text: message.text
  });
});

ui.on("changedChannel", function(channelName) {
  var channel = getChannelByName(channelName);
  populateChannel(channel);
});

slack.on("message", function(message) {
  var channel = slack.getChannelGroupOrDMByID(message.channel);
  var user = slack.getUserByID(message.user);

  if (message.type == "message" && channel && user) {
    ui.addMessage({
      user: user.name,
      channel: channel.name,
      text: message.text
    });
  }
});

slack.login();
