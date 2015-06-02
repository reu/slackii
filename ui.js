var blessed = require("blessed");
var EventEmitter = require("events").EventEmitter;

var ui = new EventEmitter;

var screen = blessed.screen({
  title: "Slackii",
  smartCSR: true,
  autoPadding: true,
  dockBorders: true,
  artificialCursor: true,
  cursorBlink: true,
});

var container = blessed.box({
  parent: screen,
  width: "100%",
  height: "100%",
});

var chatContainer = blessed.box({
  parent: container,
  top: 0,
  right: 0,
  width: "80%",
  height: "100%",
});

var sidebar = blessed.box({
  parent: container,
  left: 0,
  top: 0,
  width: "20%",
  height: "100%",
});

var messages = blessed.log({
  parent: chatContainer,
  label: "#general",
  top: 0,
  right: 0,
  bottom: 1,
  left: 0,
  width: "100%",
  height: "shrink",
  tags: true,
  mouse: true,
  keys: true,
  scrollable: true,
  scrollbar: {
    bg: "white"
  },
  border: {
    type: "line"
  },
});

var input = blessed.textbox({
  parent: chatContainer,
  width: "100%",
  bottom: 0,
  height: 1,
  focused: true,
  mouse: true,
  keys: true,
  inputOnFocus: true,
});

var channels = blessed.list({
  parent: sidebar,
  label: "Channels",
  width: "100%",
  height: "40%",
  interactive: true,
  mouse: true,
  tags: true,
  border: {
    type: "line"
  },
});

var groups = blessed.list({
  parent: sidebar,
  label: "Private groups",
  top: "40%",
  width: "100%",
  height: "30%",
  interactive: true,
  mouse: true,
  tags: true,
  border: {
    type: "line"
  },
});

var directMessages = blessed.list({
  parent: sidebar,
  label: "Direct Messages",
  width: "100%",
  top: "69%",
  height: "30%",
  interactive: true,
  mouse: true,
  tags: true,
  border: {
    type: "line"
  },
});

var currentChannel = "#general";

function channelName(channel) {
  return channel.replace(/(@|#)/, "");
}

var inputPlaceholder = "Type your message here";
input.setValue(inputPlaceholder);

input.on("submit", function() {
  ui.emit("message", { text: input.getValue(), channel: channelName(currentChannel) });
  input.clearValue();
  input.focus();
  screen.render();
});

input.on("focus", function() {
  if (input.getValue() == inputPlaceholder) {
    input.clearValue();
    screen.render();
  }
});

input.on("cancel", function() {
  input.setValue(inputPlaceholder);
});

[channels, groups, directMessages].forEach(function(channel) {
  channel.on("select", function(item) {
    currentChannel = item.getText();
    messages.setLabel(currentChannel);
    messages.setText("");
    ui.emit("changedChannel", channelName(currentChannel));
    screen.render();
  });
});


screen.key(["q", "C-c"], function() {
  process.exit(0);
});

screen.key(["escape", "i"], function() {
  input.focus();
});

screen.key("tab", function() {
  screen.focusNext();
});

screen.key("S-tab", function() {
  screen.focusPrevious();
});

function isMultiline(text) {
  return text.search("\n") >= 0;
}

ui.addMessage = function(message) {
  if (message.channel == channelName(currentChannel)) {
    if (isMultiline(message.text)) {
      messages.add(message.user + ":\n" + message.text);
    } else {
      messages.add(message.user + ": " + message.text);
    }
  }
}

ui.addChannel = function(channel) {
  channels.addItem("#" + channel.name);
}

ui.addPrivateGroup = function(privateGroup) {
  groups.addItem(privateGroup.name);
}

ui.addDirectMessage = function(dm) {
  directMessages.addItem("@" + dm.name);
}

ui.clear = function() {
  [channels, groups, directMessages].forEach(function(channel) {
    channel.clearItems();
  });
}

ui.render = function() {
  screen.render();
}

module.exports = ui;
