const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log("Bot Connected");
});

client.on('message', message => {
  console.log("Message Received: " + message.content);
});

client.on('messageReactionAdd', (reaction, user) => {
  console.log("User: " + user.username + " added reaction: " + reaction.emoji.name + " to the message: " + reaction.message);
});

client.login(token);