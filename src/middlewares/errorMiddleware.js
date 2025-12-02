const { logger } = require('../utils/logger');

/**
 * Middleware de gestion des routes non trouvées
 * Envoie une erreur 404 si la route n'est pas trouvée
 */
function notFoundHandler(req, res, next) {
    res.status(404).json({ status: 'error', message: 'Route non trouvée' });
}

/**
 * Wrapper pour les fonctions async
 * Évite d'avoir à écrire try/catch dans chaque contrôleur
 */

function errorHandler(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    // Log de l'erreur
    logger.error(`Erreur: ${error.message}`, {
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // Erreur de cast MongoDB
    if (err.name === 'dataChecker') {
        const message = 'Erreur de validation de données';
        error = {
            statusCode: 403,
            message
        };
    }

    // Erreur de validation Mongoose
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            statusCode: 400,
            message: `Erreur de validation: ${message}`
        };
    }

    // Erreur de duplication MongoDB
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} existe déjà`;
        error = {
            statusCode: 400,
            message
        };
    }

    // Erreur de cast MongoDB
    if (err.name === 'CastError') {
        const message = 'Ressource non trouvée';
        error = {
            statusCode: 404,
            message
        };
    }


    res.status(error.statusCode || 500).json({
        status: 'error',
        message: 'Erreur interne du serveur',
        // ...(server.env === 'development' && { stack: err.stack })
    });
};

/**
 * Wrapper pour les fonctions async
 * Évite d'avoir à écrire try/catch dans chaque contrôleur
 */
function catchAsync(fn) {

    return (req, res, next) => {
        // Vérifie que fn est bien une fonction
        if (typeof fn !== 'function') {
            logger.error('catchAsync: Le paramètre doit être une fonction');
            return next(new Error('Erreur interne du middleware'));
        }

        // Exécute la fonction et capture les erreurs
        Promise.resolve(fn(req, res, next)).catch((err) => {
            // Log l'erreur complète
            logger.error('Erreur asynchrone capturée:', {
                error: err.stack,
                request: {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                },
            });

            // Passe à votre middleware d'erreur principal
            next(err);
        });
    };


};


module.exports = {
    catchAsync,
    errorHandler,
    notFoundHandler
};