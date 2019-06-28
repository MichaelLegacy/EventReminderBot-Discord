const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');
const client = new Discord.Client();
const Sequelize = require('sequelize');
const SequelizeModels = require('./models');
var moment = require('moment');

const checkMarkUnicode = "✅";

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

// TODO if time allows: fix indentation and catch errors properly
client.on('ready', () => {
  console.log("Bot Connected");

  //Find all active events on restart
  SequelizeModels.event.findAll({
    where: {'active': true}
  }).then(function(response) {
    //for each active event fetch the associated message
    for (let i in response) {
        let loadedEvent = response[i].dataValues;
        // make sure the event hasn't passed yet
        let checkTime = loadedEvent.time;
        let currTime = moment();
        let messageChannel = client.channels.get(loadedEvent.channelID)
        
        if (currTime.isAfter(checkTime)) {
          SequelizeModels.event.update(
            { active: false },
            { where: {
              messageID: loadedEvent.messageID
            }
          })
          messageChannel.send('<@&' + loadedEvent.roleID + '>: Event "**' + loadedEvent.title + '**" seems to have previously started and no announcement was made.')        
        } else {  
          messageChannel.fetchMessage(loadedEvent.messageID)
          .then((eventMessage) => {
            // Filter to only the ✅ reaction (there's only 1)
            let checkmarkReact = eventMessage.reactions
              .filter(reaction => {
                return reaction._emoji.name == checkMarkUnicode;
            }).first();
            //fetch the users that used the reaction
            checkmarkReact.fetchUsers()
              .then((reactionUsers) => {
                for (let reactUserID of reactionUsers.keys()) {
                    //get the user and the associated guildMember
                    client.fetchUser(reactUserID)
                      .then((user) =>{
                          if (!user.bot) {
                            eventMessage.guild.fetchMember(user)
                              // add to the role if they don't have it
                              .then((guildMember) => {
                                  if (guildMember.roles.find(role => role.id === loadedEvent.roleID) == null){
                                      guildMember.addRole(loadedEvent.roleID);
                                  }
                              });
                          }
                      });
                };
                // get role and check all users with the role
                let eventRole = eventMessage.guild.roles.find(role => role.id == loadedEvent.roleID);
                for (guildMember of eventRole.members) {
                  let guildUser = guildMember[1].user;

                  //get array of IDs only
                  let reactionUserIDsArr = reactionUsers.map((reactionUser)=> {
                      return reactionUser.id;
                  });

                  //remove role if user is not currently reacted to the event
                  if (!reactionUserIDsArr.includes(guildUser.id)) {
                      guildMember[1].removeRole(eventRole.id)
                        .then((removedMember) => {
                            console.log("A role Was Removed from: " + guildUser.username + " they removed their reaction.")
                        })
                        .catch(console.error);
                  }
                };
              });
            });
        // set timers for active events
        setTimer(loadedEvent.time, loadedEvent.messageID);
    };
  }});
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
        mentionable: true,
        permissions: 0
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
    });
    } else if ((lowerCaseMessage === ".removeinactiveroles") && message.member.hasPermission("ADMINISTRATOR")) {
    //Find all active events on restart
    let server = message.guild;
    SequelizeModels.event.findAll({
        where: {'active': false}
    }).then(function(response) {
      let deletedRoleCount = 0;
      //for each active event fetch the associated message
      for (let i in response) {
        let loadedEvent = response[i].dataValues;
        let eventRole = server.roles.find(role => role.id == loadedEvent.roleID);
        if (eventRole) {
          eventRole.delete("This role is inactive.");
          console.log("Deleted inactive Role: " + eventRole.id);
          deletedRoleCount++;
        };
      }
      message.reply("Deleted " + deletedRoleCount + " inactive event roles.");
    })
    }
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