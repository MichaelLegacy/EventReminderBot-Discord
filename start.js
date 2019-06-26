const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config/config.json');
var mysql = require('mysql');
var moment = require('moment');

client.on('ready', () => {
  // connect to database
  var con = mysql.createConnection({
    host: config.database.host,
    user: config.database.user,
    password: config.database.password
  });

  // ensure connection is there
  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected to database");
  })
  
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
    // console.log(message.id);
    message.channel.send("Event Title: " + remainingMessage[0]);
    message.channel.send("Event time from now (days-hours-minutes): " + remainingMessage[1]);

    // add the user time with message time
    regexString = /(\d)+/g
    userTime = remainingMessage[1].match(regexString);
    // console.log(userTime);
    let messageTime = moment(message.createdAt);
    // console.log(messageTime);
    let eventTime = messageTime.add(userTime[0], 'days').add(userTime[1], 'hours').add(userTime[2], 'minutes');
    // console.log(eventTime);

    // make the role and assign to creator
    let role = {};
    message.guild.createRole({
      name: 'event:' + message.id,
      mentionable: true
    }).catch(err => {
      console.error(err);
      message.channel.send('Error creating the role.');
    }).then(function(createdRole) {
      role = createdRole;
      message.member.addRole(role).catch(err => {
      console.error(err);
      message.channel.send('Error adding member to role.');
    })});
    // console.log(role);
    // message.member.addRole(role).catch(err => {
    //   console.error(err);
    //   message.channel.send('Error adding member to role.');
    // });
    //con.query('insert into ? values(?,?,?,?,?,?)', [config.database.table, message.id, remainingMessage[0], localtime,])

}

});

client.on('messageReactionAdd', (reaction, user) => {
  console.log("User: " + user.username + " added reaction: " + reaction.emoji.name + "  to the message: " + reaction.message);
});

client.login(token);