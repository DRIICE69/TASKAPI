const { randomUUID } = require("crypto");
/**
 * Génère un ID de tache unique
 * @returns {string} - L'ID de tache généré
 */
function generateTxId() {
    return `TASK-${randomUUID().split("-")[0].toUpperCase()}`;
}

module.exports = { generateTxId };