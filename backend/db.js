// db.js
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('vulnerabilitiesvnos', 'root', '1234', {
  host: 'localhost',
  port:3306,
  dialect: 'mysql',
});


const Vulnerability = sequelize.define('Vulnerability', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
  },
  description: {
    type: DataTypes.TEXT,
  },
  date: {
    type: DataTypes.DATE,
  },
  sourceUrl: {
    type: DataTypes.STRING,
  },
  exploits: {
    type: DataTypes.STRING, 
  },
});

const ScanResult = sequelize.define('ScanResult', {
  host: {
    type: DataTypes.STRING,
    allowNull: false
  },
  service: {
    type: DataTypes.STRING,
    allowNull: false
  },
  exploit: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  statusDesc:{
    type: DataTypes.STRING,
    allowNull: false
  }
});


module.exports = { sequelize, Vulnerability,ScanResult };
