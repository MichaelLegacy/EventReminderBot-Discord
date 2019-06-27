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

function setTimer(time, id) {
  console.log('start timer');
  let startTime = moment();
  let endTime = moment(time);
  let timeToEvent = endTime.diff(startTime, 'seconds');
  timeToEvent *= 1000;
  setTimeout(endTimer, timeToEvent, id);
}

function endTimer(id) {
  console.log('end timer');
  SequelizeModels.event.findOne({
    where: {
      messageID: id
    }}).then(eventMessage => {
      if (eventMessage.active === true) {
        let eventChannel = client.channels.get(eventMessage.channelID);
        let eventServer = client.guilds.get(eventMessage.serverID);
        let eventRole = eventServer.roles.get(eventMessage.roleID);
        eventChannel.send('<@&' + eventMessage.roleID + '>: Event "**' + eventMessage.title + '**" is starting now!');
        SequelizeModels.event.update(
          { active: false },
          {where: {
            messageID: id
          }
        })
        
      }
    })
}
client.on('ready', () => {
  console.log("Bot Connected");

  // fetch other messages

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

    //get neccessary data
    let messageID;
    let eventTitle = remainingMessage[0];
    let creatorID = message.author.id;
    let serverID = message.guild.id;
    let channelID = message.channel.id;

    // add the user time with message time
    regexString = /(\d)+/g
    userTime = remainingMessage[1].match(regexString);
    let messageTime = moment(message.createdAt);
    let eventTime = messageTime.add(userTime[0], 'days').add(userTime[1], 'hours').add(userTime[2], 'minutes');

    // make the bot message
    var embed = new Discord.RichEmbed();
    embed.setTitle(eventTitle);
    message.channel.send(embed)
    .catch(console.error)
    .then((embedMessage) => {
      embedMessage.react('✅');
      messageID = embedMessage.id;
      console.log(messageID);
    }).catch(console.error)
    .then((embed) => {
      message.guild.createRole({
        name: 'event:' + messageID,
        mentionable: true
      }).catch(err => {
        console.error(err);
        message.channel.send('Error creating the role.');
      }).then(function(createdRole) {
        let roleID = createdRole.id;
        SequelizeModels.event.create({
          messageID: messageID,
          title: eventTitle,
          creatorID: creatorID,
          serverID: serverID,
          roleID: roleID,
          active: true,
          time: eventTime,
          channelID: channelID
        }).then((newEvent) => {
            // console.log('event created: ' + newEvent.eventTitle);
            setTimer(eventTime, messageID);
        })
          .catch(console.error);
      });
    })};
  });

client.on('messageReactionAdd', (reaction, user) => {
  console.log("User: " + user.username + " added reaction: " + reaction.emoji.name + "  to the message: " + reaction.message);
  // only check for preset emoji
  if (reaction.emoji.name === '✅') {
    SequelizeModels.event.findOne({
      where: {
        messageID: reaction.message.id
      }}).then(eventMessage => {
        if (eventMessage != null) {
          reaction.message.guild.fetchMember(user).then(eventMember => {
            eventMember.addRole(eventMessage.roleID);
        }).catch(console.error);
      }}).catch(console.error);
  }});

client.on('messageReactionRemove', (reaction, user) => {
  console.log('User: ' + user.username + ' removed reaction: ' + reaction.emoji.name + ' to the message: ' + reaction.message);
  // only check for preset emoji
  if (reaction.emoji.name === '✅') {
    console.log('pass name check');
    SequelizeModels.event.findOne({
      where: {
        messageID: reaction.message.id
      }}).then(eventMessage => {
        if (eventMessage != null) {
          console.log('deleting role');
          reaction.message.guild.fetchMember(user).then(eventMember => {
            eventMember.removeRole(eventMessage.roleID);
        }).catch(console.error);
      }}).catch(console.error);
  }});
        


client.login(token);