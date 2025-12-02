const { body, param, validationResult } = require('express-validator');

// Gestion des erreurs
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array()[0]?.msg });
    }
    next();
};

// Regex 
const ALLOWED_REGEX = /^[a-zA-Z0-9\s\-_']+$/;

// Helper pour vérifier qu'il y a au moins une lettre
const containsLetter = (value) => /[a-zA-Z]/.test(value);

// Validation pour la creation d'une tâche
const validateCreateTask = [
    body('title')
        .isString()
        .withMessage('Le titre doit être une chaîne de caractères')
        .matches(ALLOWED_REGEX)
        .withMessage('Le titre contient des caractères non autorisés')
        .custom(value => {
            if (!containsLetter(value)) {
                throw new Error('Le titre doit contenir au moins une lettre');
            }
            return true;
        })
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Le titre doit contenir entre 3 et 100 caractères'),

    body('description')
        .isString()
        .withMessage('La description doit être une chaîne de caractères')
        .matches(ALLOWED_REGEX)
        .withMessage('La description contient des caractères non autorisés')
        .custom(value => {
            if (!containsLetter(value)) {
                throw new Error('La description doit contenir au moins une lettre');
            }
            return true;
        })
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('La description doit contenir entre 3 et 100 caractères'),

    body('dueDate')
        .isISO8601()
        .withMessage('La date limite doit être une date valide')
        .isAfter(new Date().toISOString())
        .withMessage('La date limite doit être une date future'),
];


// Validation pour l'obtention et la suppression d'une tâche
const validateGetDelTask = [
    param('id')
        .isString()
        .matches(/^[a-zA-Z0-9\-_]+$/)
        .withMessage('L\'ID contient des caractères non autorisés')
        .trim()
        .isLength({ min: 3, max: 20 })
        .withMessage('L\'ID doit contenir entre 3 et 20 caractères'),
];


// Validation pour la mise à jour d'une tâche
const validateUpdateTask = [
    body('title')
        .optional()
        .isString()
        .matches(ALLOWED_REGEX)
        .withMessage('Le titre contient des caractères non autorisés')
        .custom(value => {
            if (!containsLetter(value)) {
                throw new Error('Le titre doit contenir au moins une lettre');
            }
            return true;
        })
        .trim()
        .isLength({ min: 3, max: 100 }),

    body('description')
        .optional()
        .isString()
        .matches(ALLOWED_REGEX)
        .withMessage('La description contient des caractères non autorisés')
        .custom(value => {
            if (!containsLetter(value)) {
                throw new Error('La description doit contenir au moins une lettre');
            }
            return true;
        })
        .trim()
        .isLength({ min: 3, max: 100 }),

    body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('La date limite doit être une date valide')
        .isAfter(new Date().toISOString())
        .withMessage('La date limite doit être une date future'),

    body('completed')
        .optional()
        .custom(value => {
            const allowed = [true, false, "true", "false", 1, 0, "1", "0"];

            if (!allowed.includes(value)) {
                throw new Error('Le statut doit être un booléen (true / false)');
            }

            return true;
        })

];


module.exports = {
    validateCreateTask,
    validateGetDelTask,
    validateUpdateTask,
    handleValidationErrors
};
