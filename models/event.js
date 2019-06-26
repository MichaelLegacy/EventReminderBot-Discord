'use strict';
module.exports = (sequelize, DataTypes) => {
  const event = sequelize.define('event', {
    messageID: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    creatorID: {
      type: DataTypes.STRING,
      allowNull: false
    },
    serverID: {
      type: DataTypes.STRING,
      allowNull: false
    },
    roleID: { 
      type: DataTypes.STRING,
      allowNull:false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    time:{
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {});
  event.associate = function(models) {
    // associations can be defined here
  };
  return event;
};