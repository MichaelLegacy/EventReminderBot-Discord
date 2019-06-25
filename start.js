const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log("Bot Connected");
});

client.on('message', message => {
  console.log("Message Received: " + message.content);

  //Dont respond to bot messages.
  if (message.author.bot){
      return;
  }

  let lowerCaseMessage = message.content.toLowerCase();

  // command looks like:
  // .CreateEvent "Title here" days-hours-minutes
  // where days-hours-minutes is the relative start time of the event from now
  if (lowerCaseMessage.startsWith(".createevent")) {
    let remainingMessage = message.content.slice(".CreateEvent".length, message.content.length);
    let regexString = /("[^"]+"|[^"\s]+)/g
    remainingMessage = remainingMessage.match(regexString);
    remainingMessage[0] = remainingMessage[0].replace(/^"([^"]+)"$/,"$1");
    console.log(remainingMessage);
    message.channel.send("Event Title: " + remainingMessage[0]);
    message.channel.send("Event time from now (days-hours-minutes): " + remainingMessage[1]);
}

});

client.on('messageReactionAdd', (reaction, user) => {
  console.log("User: " + user.username + " added reaction: " + reaction.emoji.name + "  to the message: " + reaction.message);
});

client.login(token);