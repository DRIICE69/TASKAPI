const Task = require('../models/taskModel');
const { catchAsync } = require('../middlewares/errorMiddleware');
const { logger } = require('../utils/logger');
const { generateTxId } = require('../utils/core');
const NodeCache = require('node-cache');
const taskCache = new NodeCache();
/**
 * 
 */
class TaskController {
  /**
   * Helper: nettoie un document de tâche ou un objet plat
   * @param {Object} task - Le document de tâche ou l'objet plat à nettoyer
   * @returns {Object} Le document de tâche ou l'objet plat nettoyé
   */
  sanitizeTask(task) {
    if (!task) return null;
    const obj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    delete obj._id;
    return obj;
  }

  /**
   * Helper: nettoie un tableau de tâches
   * @param {Array} tasks - Le tableau de tâches à nettoyer
   * @returns {Array} Le tableau de tâches nettoyé
   */
  sanitizeTasks(tasks) {
    return Array.isArray(tasks) ? tasks.map(this.sanitizeTask) : [];
  }

  /**
   * Récupère toutes les tâches
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async getAllTasks() {
    try {
      const cachedTasks = taskCache.get('tasks');
      if (cachedTasks !== undefined) {
        return { statusCode: 200, success: true, data: cachedTasks };
      }
      const tasks = await Task.find({ status: 'active' }).sort({ createdAt: -1 });
      taskCache.set('tasks', this.sanitizeTasks(tasks));
      return { statusCode: 200, success: true, data: this.sanitizeTasks(tasks) };
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Recherche une tâche par ID et retourne un objet nettoyé
   * @param {string} id - L'ID de la tâche à rechercher
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async findTaskById(id) {
    try {
      const cachedTask = taskCache.get(id);
      if (cachedTask !== undefined && cachedTask !== null && cachedTask.status === 'active') {
        return { statusCode: 200, success: true, data: cachedTask };
      }
      const task = await Task.findOne({ taskId: id, status: 'active' });
      if (!task) {
        logger.error(`Tâche ${id} non trouvée`);
        return { statusCode: 404, success: false, message: 'Tâche non trouvée' };
      }
      return { statusCode: 200, success: true, data: task ? this.sanitizeTask(task) : null };
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Crée une nouvelle tâche
   * @param {Object} payload - Les données de la tâche à créer
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async createTaskRecord(payload) {
    payload.taskId = await generateTxId();
    try {
      const task = await Task.create(payload);
      if (!task) {
        return { statusCode: 500, success: false, message: 'Erreur lors de la création de la tâche' };
      }

      // Invalidation du cache 'tasks' pour forcer le rechargement
      taskCache.del("tasks");
      const sanitizedTask = this.sanitizeTask(task);
      // Mise à jour du cache individuel
      taskCache.set(task.taskId, sanitizedTask);

      logger.info(`Tâche ${task.taskId} créée avec succès`);
      return { statusCode: 201, success: true, data: sanitizedTask };
    } catch (err) {

      logger.error(`Erreur lors de la création de la tâche: ${err.message}`);
      throw new Error(err);
    }
  }

  /**
   * Met à jour une tâche
   * @param {string} taskId - L'ID de la tâche à mettre à jour
   * @param {Object} payload - Les données de la tâche à mettre à jour
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async updateTaskRecord(taskId, payload) {
    try {
      if (payload.completed !== undefined) {
        payload.completed = ["true", "1", 1, true].includes(payload.completed);
      }

      const task = await Task.findOneAndUpdate(
        { taskId: taskId, status: 'active' },
        payload,
        { new: true }
      );

      if (!task) {
        logger.warn(`Tentative de mise à jour d'une tâche inexistante ou inactive: ${taskId}`);
        return { statusCode: 404, success: false, message: 'Tâche non trouvée ou impossible à mettre à jour' };
      }

      const sanitizedTask = this.sanitizeTask(task);

      taskCache.set(taskId, sanitizedTask);

      // Invalidation du cache 'tasks' pour forcer le rechargement
      taskCache.del('tasks');

      logger.info(`Tâche ${task.taskId} mise à jour avec succès`);
      return { statusCode: 200, success: true, data: sanitizedTask };
    } catch (err) {
      logger.error(`Erreur lors de la mise à jour de la tâche: ${err.message}`);
      throw new Error(err);
    }
  }

  /**
   * Supprime une tâche (soft delete)
   * @param {string} taskId - L'ID de la tâche à supprimer
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async softDeleteTask(taskId) {
    try {
      const task = await Task.findOneAndUpdate(
        { taskId: taskId, status: 'active' },
        { status: 'inactive' },
        { new: true }
      );

      if (!task) {
        logger.warn(`Tentative de suppression d'une tâche inexistante ou inactive: ${taskId}`);
        return { statusCode: 404, success: false, message: 'Tâche non trouvée' };
      }

      taskCache.del(taskId);

      // Invalidation du cache 'tasks' pour forcer le rechargement
      taskCache.del('tasks');

      logger.info(`Tâche ${task.taskId} supprimée avec succès`);
      return { statusCode: 200, success: true, data: this.sanitizeTask(task) };
    } catch (err) {
      logger.error(`Erreur lors de la suppression de la tâche: ${err.message}`);
      throw new Error(err);
    }
  }

  /**
   * HTTP POST api/tasks
   * Créé une nouvelle tâche
   * @param {Object} req - L'objet de la requête
   * @param {Object} res - L'objet de la réponse
   * @returns {Promise<void>}
   */
  createTask = catchAsync(async (req, res) => {
    const { title, description, dueDate } = req.body;
    const result = await this.createTaskRecord({ title, description, dueDate });
    if (!result.success) return res.status(result.statusCode).json({ success: false, message: result.message });
    res.status(result.statusCode).json({ success: true, message: 'Tâche créée avec succès', data: result.data });
  });

  /**
   * HTTP GET api/tasks
   * Récupère toutes les tâches
   * @param {Object} req - L'objet de la requête
   * @param {Object} res - L'objet de la réponse
   * @returns {Promise<void>}
   */
  getTasks = catchAsync(async (req, res) => {
    const result = await this.getAllTasks();
    if (!result.success) return res.status(result.statusCode).json({ success: false, message: result.message });
    res.status(result.statusCode).json({ success: true, data: result.data });
  });

  /**
   * HTTP GET api/tasks/:id
   * Récupère une tâche par ID
   * @param {Object} req - L'objet de la requête
   * @param {Object} res - L'objet de la réponse
   * @returns {Promise<void>}
   */
  getTask = catchAsync(async (req, res) => {
    const result = await this.findTaskById(req.params.id);
    if (!result.success) return res.status(result.statusCode).json({ success: false, message: result.message });
    if (!result.data) return res.status(result.statusCode).json({ success: false, message: 'Tâche non trouvée' });
    res.status(result.statusCode).json({ success: true, data: result.data });
  });

  /**
   * HTTP PUT api/tasks/:id
   * Met à jour une tâche
   * @param {Object} req - L'objet de la requête
   * @param {Object} res - L'objet de la réponse
   * @returns {Promise<void>}
   */
  updateTask = catchAsync(async (req, res) => {
    const result = await this.updateTaskRecord(req.params.id, req.body);
    if (!result.success) return res.status(result.statusCode).json({ success: false, message: result.message });
    if (!result.data) return res.status(result.statusCode).json({ success: false, message: 'Tâche non trouvée' });
    res.status(result.statusCode).json({ success: true, data: result.data });
  });

  /**
   * HTTP DELETE api/tasks/:id
   * Supprime une tâche (soft delete)
   * @param {Object} req - L'objet de la requête
   * @param {Object} res - L'objet de la réponse
   * @returns {Promise<void>}
   */
  deleteTask = catchAsync(async (req, res) => {
    const result = await this.softDeleteTask(req.params.id);
    if (!result.success) return res.status(result.statusCode).json({ success: false, message: result.message });
    if (!result.data) return res.status(result.statusCode).json({ success: false, message: 'Tâche non trouvée' });
    res.status(result.statusCode).json({ success: true, message: 'Tâche supprimée' });
  });

}

module.exports = new TaskController();
