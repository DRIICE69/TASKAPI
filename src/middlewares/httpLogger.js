const { logger } = require('../utils/logger');

/**
 * Middleware de logging HTTP structuré
 * Capture toutes les requêtes avec métadonnées enrichies
 */
const httpLogger = (req, res, next) => {
    const startTime = Date.now();

    // Intercepter la réponse pour logger après l'envoi
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;

        // Déterminer le niveau de log selon le status code
        let logLevel = 'http';
        if (statusCode >= 500) {
            logLevel = 'error';
        } else if (statusCode >= 400) {
            logLevel = 'warn';
        }

        // Construire les métadonnées
        const logData = {
            method: req.method,
            url: req.originalUrl || req.url,
            path: req.path,
            statusCode,
            duration: `${duration}ms`,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            referer: req.headers.referer || null,
            contentLength: res.get('Content-Length') || 0,
        };

        // Ajouter des infos sur les erreurs 4xx/5xx
        if (statusCode >= 400) {
            logData.query = req?.query || null;
            logData.body = req?.body || null;
        }

        logger.log(logLevel, `${req.method} ${req.originalUrl} ${statusCode} - ${duration}ms`, logData);
    });

    // Capturer les erreurs de connexion
    res.on('error', (error) => {
        logger.logError(error, {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
        });
    });

    next();
};

module.exports = { httpLogger };