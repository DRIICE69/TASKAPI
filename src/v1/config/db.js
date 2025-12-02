const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const { logger } = require('../utils/logger');
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://mongo:27017/todo_db';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000
    });
    logger.info('MongoDB connecté avec succès');
  } catch (error) {
    logger.error('Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
