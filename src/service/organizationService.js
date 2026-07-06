const BaseService = require('./baseService');
const { getDb } = require('../dataAccessor/mysql/databaseHandler');
const NotFoundError = require('../exception/notFoundError');
const ConflictError = require('../exception/conflictError');
const { ERROR_CODES } = require('../constant/constants');

class OrganizationService extends BaseService {
  constructor() {
    super('OrganizationService');
  }

  async createOrganization(name, slug) {
    const { Organization } = getDb().models;

    const existing = await Organization.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictError(`Organization with slug '${slug}' already exists`, ERROR_CODES.DUPLICATE_ENTRY);
    }

    const org = await Organization.create({ name, slug });
    this.logInfo(`Created organization: ${name} (${slug})`);
    return org;
  }

  async getOrganization(orgId) {
    const { Organization } = getDb().models;

    const org = await Organization.findByPk(orgId);
    if (!org) {
      throw new NotFoundError(`Organization ${orgId} not found`, ERROR_CODES.ORG_NOT_FOUND);
    }

    return org;
  }

  async listOrganizations() {
    const { Organization } = getDb().models;
    return Organization.findAll({ order: [['name', 'ASC']] });
  }
}

module.exports = new OrganizationService();
