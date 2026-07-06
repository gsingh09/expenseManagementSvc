const BaseService = require('./baseService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const NotFoundError = require('../exception/notFoundError');
const BadRequestError = require('../exception/badRequestError');
const ConflictError = require('../exception/conflictError');
const { ERROR_CODES } = require('../constant/constants');

class UserService extends BaseService {
  constructor() {
    super('UserService');
  }

  async createUser(orgId, { email, firstName, lastName, deptId, managerId }) {
    const { User, Organization } = getDb().models;

    // Verify organization exists
    const org = await Organization.findByPk(orgId);
    if (!org) {
      throw new NotFoundError(`Organization ${orgId} not found`, ERROR_CODES.ORG_NOT_FOUND);
    }

    // Check email uniqueness
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new ConflictError(`User with email '${email}' already exists`, ERROR_CODES.DUPLICATE_ENTRY);
    }

    // Verify manager exists if provided
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager || manager.org_id !== orgId) {
        throw new NotFoundError(`Manager ${managerId} not found in organization`, ERROR_CODES.USER_NOT_FOUND);
      }
    }

    const user = await User.create({
      org_id: orgId,
      email,
      first_name: firstName,
      last_name: lastName,
      dept_id: deptId,
      manager_id: managerId
    });

    this.logInfo(`Created user: ${email} in org ${orgId}`);
    return user;
  }

  async getUser(userId) {
    const { User } = getDb().models;

    const user = await User.findByPk(userId, {
      include: [
        { association: 'manager', attributes: ['id', 'email', 'first_name', 'last_name'] },
        { association: 'subordinates', attributes: ['id', 'email', 'first_name'] }
      ]
    });

    if (!user) {
      throw new NotFoundError(`User ${userId} not found`, ERROR_CODES.USER_NOT_FOUND);
    }

    return user;
  }

  async getUsersInOrg(orgId) {
    const { User } = getDb().models;

    return User.findAll({
      where: { org_id: orgId },
      order: [['email', 'ASC']],
      include: [
        { association: 'manager', attributes: ['id', 'email', 'first_name'] }
      ]
    });
  }

  async assignRole(userId, roleId) {
    const { User, Role, UserRole } = getDb().models;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`, ERROR_CODES.USER_NOT_FOUND);
    }

    const role = await Role.findByPk(roleId);
    if (!role || role.org_id !== user.org_id) {
      throw new NotFoundError(`Role ${roleId} not found in user's organization`, ERROR_CODES.NOT_FOUND);
    }

    // Check if already assigned
    const existing = await UserRole.findOne({
      where: { user_id: userId, role_id: roleId }
    });

    if (existing) {
      return existing;
    }

    const userRole = await UserRole.create({
      user_id: userId,
      role_id: roleId
    });

    this.logInfo(`Assigned role ${roleId} to user ${userId}`);
    return userRole;
  }

  async getUserRoles(userId) {
    const { User } = getDb().models;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`, ERROR_CODES.USER_NOT_FOUND);
    }

    return user.getRoles();
  }

  async getManagerChain(userId) {
    const { User } = getDb().models;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError(`User ${userId} not found`, ERROR_CODES.USER_NOT_FOUND);
    }

    const chain = [user];
    let currentManager = user.manager_id;
    const visited = new Set([userId]);

    while (currentManager) {
      if (visited.has(currentManager)) {
        this.logWarn(`Circular manager reference detected for user ${userId}`);
        break;
      }

      const manager = await User.findByPk(currentManager);
      if (!manager) break;

      chain.push(manager);
      visited.add(currentManager);
      currentManager = manager.manager_id;
    }

    return chain;
  }
}

module.exports = new UserService();
