'use strict';

module.exports = {
  up: function(queryInterface, Sequelize) {
    queryInterface.addColumn(
      'events',
      'channelID',
      {
      type: Sequelize.STRING,
      allowNull: false
      }
    )
  },
  down: function(queryInterface, Sequelize) {
    queryInterface.removeColumn('events', 'channelID');
  }
};