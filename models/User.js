const sql = require("mssql");
const dbConfig = require("../db");

// Tüm kullanıcıları getir
async function getAllUsers() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query(`
    SELECT 
        ID, 
        NAME, 
        EMAIL, 
        RECORD_DATE, 
        UPDATE_DATE 
    FROM Users
  `);
  return result.recordset;
}

// ID'ye göre kullanıcı getir
async function getUserById(id) {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request()
    .input("id", sql.Int, id)
    .query(`
      SELECT 
        ID, 
        NAME, 
        EMAIL, 
        RECORD_DATE, 
        UPDATE_DATE 
      FROM Users 
      WHERE ID = @id
    `);
  return result.recordset[0];
}

// Yeni kullanıcı oluştur
async function createUser(name, email) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("name", sql.VarChar, name)
    .input("email", sql.VarChar, email)
    .query(`
      INSERT INTO Users (NAME, EMAIL, RECORD_DATE)
      VALUES (@name, @email, GETDATE())
    `);
}

// Kullanıcı güncelle
async function updateUser(id, name, email) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("id", sql.Int, id)
    .input("name", sql.VarChar, name)
    .input("email", sql.VarChar, email)
    .query(`
      UPDATE Users 
      SET 
        NAME = @name, 
        EMAIL = @email, 
        UPDATE_DATE = GETDATE()
      WHERE ID = @id
    `);
}

// Kullanıcı sil
async function deleteUser(id) {
  const pool = await sql.connect(dbConfig);
  await pool.request()
    .input("id", sql.Int, id)
    .query(`
      DELETE FROM Users 
      WHERE ID = @id
    `);
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
