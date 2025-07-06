const sql = require("mssql");
const bcrypt = require("bcrypt");
const dbConfig = require("../db");

async function registerManager(data) {
  console.log("👉 register data:", data); // Burası önemli
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("name", sql.VarChar, data.name)
    .input("surname", sql.VarChar, data.surname)
    .input("username", sql.VarChar, data.username)
    .input("password", sql.VarChar, data.password)
    .input("mail", sql.VarChar, data.mail)
    .query(`
      INSERT INTO MANAGERS (MANAGER_NAME, MANAGER_SURNAME, MANAGER_USERNAME, MANAGER_PASSWORD, MANAGER_MAIL)
      VALUES (@name, @surname, @username, @password, @mail)
    `);
  return result;
}

async function loginManager(username, password) {
  await sql.connect(dbConfig);
  const result = await sql.query`
    SELECT * FROM MANAGERS WHERE MANAGER_USERNAME = ${username}
  `;
  if (result.recordset.length === 0) return null;

  const manager = result.recordset[0];
  const isValid = await bcrypt.compare(password, manager.MANAGER_PASSWORD);
  return isValid ? manager : null;
}

module.exports = {
  registerManager,
  loginManager
};
