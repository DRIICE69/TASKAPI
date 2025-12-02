const winston = require('winston');
const path = require('path');

// Définition des niveaux de log et des couleurs
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Ajout des couleurs à winston
winston.addColors(colors);

const logDir = path.join(__dirname, '../../logs');

// Format JSON structuré pour les fichiers
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillWith: ['timestamp', 'service'] }),
  winston.format.json()
);

// Format console coloré et lisible
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Ajouter les métadonnées si présentes
    const meta = { ...metadata };
    delete meta.timestamp;
    delete meta.level;
    delete meta.message;

    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }

    return msg;
  })
);

// Définition des transports (où les logs seront stockés)
const transports = [
  // Console avec format lisible et coloré
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Fichier pour toutes les erreurs
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Fichier pour tous les logs
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),

  // Fichier pour les logs HTTP
  new winston.transports.File({
    filename: path.join(logDir, 'http.log'),
    level: 'http',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),

  // Fichier pour les warnings
  new winston.transports.File({
    filename: path.join(logDir, 'warn.log'),
    level: 'warn',
    format: jsonFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 3,
  }),
];

// Création du logger
const logger = winston.createLogger({
  level: 'info',
  levels,
  defaultMeta: { service: "" },
  transports,
  exitOnError: false,
});

// Méthodes helper pour logging structuré avec métadonnées
logger.logWithContext = (level, message, context = {}) => {
  logger.log(level, message, {
    ...context,
    timestamp: new Date().toISOString(),
  });
};

logger.logHttp = (req, res, duration) => {
  logger.http('HTTP Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.clientIp || req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id || null,
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

// Stream pour Morgan (middleware HTTP)
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = {
  logger
};

