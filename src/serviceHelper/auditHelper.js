const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const logger = require('../logger/logger');

class AuditHelper {
  async logAction(expenseId, actorId, action, oldValue = null, newValue = null) {
    try {
      const { AuditLog } = getDb().models;

      await AuditLog.create({
        expense_id: expenseId,
        actor_id: actorId,
        action,
        old_value: oldValue,
        new_value: newValue
      });

      logger.debug(`[AuditHelper] Logged action: ${action} for expense ${expenseId}`);
    } catch (error) {
      logger.error(`[AuditHelper] Failed to log action: ${error.message}`, error);
      // Don't throw - audit logging should not block operations
    }
  }

  async getExpenseAudit(expenseId) {
    const { AuditLog } = getDb().models;

    const logs = await AuditLog.findAll({
      where: { expense_id: expenseId },
      order: [['createdAt', 'ASC']]
    });

    return logs;
  }
}

module.exports = new AuditHelper();
