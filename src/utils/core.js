const { randomUUID } = require("crypto");
/**
 * Génère un ID de tache unique
 * @returns {string} - L'ID de tache généré
 */
function generateTxId() {
    return `TASK-${randomUUID().split("-")[0].toUpperCase()}`;
}

/**
 * Helper: nettoie un document de tâche ou un objet plat
 * @param {Object} task - Le document de tâche ou l'objet plat à nettoyer
 * @returns {Object} Le document de tâche ou l'objet plat nettoyé
 */
function sanitizeTask(task) {
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
function sanitizeTasks(tasks) {
    return Array.isArray(tasks) ? tasks.map(sanitizeTask) : [];
}

module.exports = { generateTxId, sanitizeTask, sanitizeTasks };