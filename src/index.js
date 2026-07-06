require('dotenv').config({
  path: `${process.env.CONFIG_FILE || './config/expense-management-svc'}/${process.env.NODE_ENV || 'local'}/application.env`
});

require('./application/index');
