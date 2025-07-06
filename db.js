const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://myuser_im5y_user:e7UF8yeSryKnZa03Is4q0T2SCZto84xU@dpg-d1l74r6r433s73dc0440-a.frankfurt-postgres.render.com:5432/myuser_im5y",
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
