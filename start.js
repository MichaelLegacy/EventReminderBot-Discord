const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');
const client = new Discord.Client();
const Sequelize = require('sequelize');
const SequelizeModels = require('./models');
var moment = require('moment');


const SequelizeConnect = new Sequelize({
    host: 'localhost',
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    pool: {
      max: 20,
      min: 0,
      idle: 10000
    },
    define: {
      charset: 'utf8',
      collate: 'utf8_general_ci',
      timestamps: true
    }
  });

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
    //console.log(remainingMessage);

    //get neccessary data
    let messageID = message.id;
    let eventTitle = remainingMessage[0];
    let creatorID = message.author.id;
    let serverID = message.guild.id;

    // add the user time with message time
    regexString = /(\d)+/g
    userTime = remainingMessage[1].match(regexString);
    //console.log(userTime);
    let messageTime = moment(message.createdAt);
    //console.log(messageTime);
    let eventTime = messageTime.add(userTime[0], 'days').add(userTime[1], 'hours').add(userTime[2], 'minutes');
    //console.log(eventTime);

    // make the role and assign to creator
    message.guild.createRole({
      name: 'event:' + messageID,
      mentionable: true
    }).catch(err => {
      console.error(err);
      message.channel.send('Error creating the role.');
    }).then(function(createdRole) {
      let roleID = createdRole.id;
      message.member.addRole(roleID)
        .catch(err => {
          console.error(err);
          message.channel.send('Error adding member to role.');
        })
      SequelizeModels.event.create({
        messageID: messageID,
        title: eventTitle,
        creatorID: creatorID,
        serverID: serverID,
        roleID: roleID,
        active: true,
        time: eventTime
      }).then((newEvent) => {
          console.log('event created: ' + newEvent.eventTitle);
      })
        .catch(console.error);
    });
  }

});

client.on('messageReactionAdd', (reaction, user) => {
  console.log("User: " + user.username + " added reaction: " + reaction.emoji.name + "  to the message: " + reaction.message);
});

client.login(token);