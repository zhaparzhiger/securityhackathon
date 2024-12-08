// Middleware для проверки токена
const jwt = require('jsonwebtoken');
const express = require('express');
const app = express();
function authenticateBot(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
      return res.status(403).send('Token is required');
    }
  
    jwt.verify(token, 'dawgawr31', (err, decoded) => {
      if (err) {
        return res.status(401).send('Invalid token');
      }
      req.bot = decoded; 
      next();  
    });
  }
  module.exports =authenticateBot