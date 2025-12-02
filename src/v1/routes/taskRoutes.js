const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { validateCreateTask, validateGetDelTask, validateUpdateTask, handleValidationErrors } = require('../middlewares/validationMiddleware');

// Routes
// GET : Récupère toutes les tâches
router.get('/task', TaskController.getTasks);
// GET : Récupère une tâche par ID
router.get('/task/:id', validateGetDelTask, handleValidationErrors, TaskController.getTask);
// POST : Crée une nouvelle tâche
router.post('/task', validateCreateTask, handleValidationErrors, TaskController.createTask);
// PUT : Met à jour une tâche
router.put('/task/:id', validateUpdateTask, handleValidationErrors, TaskController.updateTask);
// DELETE : Supprime une tâche
router.delete('/task/:id', validateGetDelTask, handleValidationErrors, TaskController.deleteTask);
module.exports = router;
