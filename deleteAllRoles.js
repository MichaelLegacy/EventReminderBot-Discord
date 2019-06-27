const token = require('./token.js'); //Discord API token
const Discord = require('discord.js');

const client = new Discord.Client();

client.on('ready', () => {
    console.log("Bot Connected");
    for (guild of client.guilds) {
      let eventRoles = null;
      eventRoles = guild[1].roles.filter((role) => { 
        return role.name.includes("event:");
      });
      for (let deletingRole of eventRoles) {
        console.log('deletingRole');
        deletingRole[1].delete("too many event roles");
      };
    };
});

client.login(token);