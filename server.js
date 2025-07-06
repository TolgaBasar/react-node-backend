const express = require("express");
const cors = require("cors");
const sql = require("mssql");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const verifyToken = require("./middlewares/auth");
const sendMail = require("./utils/sendMail");
const app = express();
const PORT = 5000;
const JWT_SECRET = "supersecretkey123!";

const dbConfig = {
  user: "fullstackuser",
  password: "1234",
  server: "TOLGA",
  database: "FullstackDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

app.use(cors());
app.use(express.json());

// ✅ Mail gönderme fonksiyonu
 

 
 

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input("username", sql.VarChar, username)
      .input("password", sql.VarChar, password)
      .query(`
        SELECT * FROM MANAGERS 
        WHERE MANAGER_USERNAME = @username 
          AND MANAGER_PASSWORD = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı veya şifre yanlış." });
    }

    // ✅ Gerçek JWT token üret
    const token = jwt.sign(
      { id: result.recordset[0].MANAGER_ID },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      user: result.recordset[0],
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});




// ✅ REGISTER
app.post("/api/register", async (req, res) => {
  const { manager_name, manager_surname, manager_username, manager_password, manager_mail } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    // ✅ Aynı kullanıcı kontrolü
    const check = await pool.request()
      .input("manager_name", sql.VarChar, manager_name)
      .input("manager_surname", sql.VarChar, manager_surname)
      .input("manager_username", sql.VarChar, manager_username)
      .input("manager_mail", sql.VarChar, manager_mail)
      .query(`
        SELECT * FROM MANAGERS
        WHERE 
          MANAGER_NAME = @manager_name AND 
          MANAGER_SURNAME = @manager_surname AND 
          MANAGER_USERNAME = @manager_username AND 
          MANAGER_MAIL = @manager_mail
      `);

    if (check.recordset.length > 0) {
      return res.status(400).json({ success: false, message: "duplicate" });
    }

    // ✅ Yeni kayıt
    await pool.request()
      .input("manager_name", sql.VarChar, manager_name)
      .input("manager_surname", sql.VarChar, manager_surname)
      .input("manager_username", sql.VarChar, manager_username)
      .input("manager_password", sql.VarChar, manager_password)
      .input("manager_mail", sql.VarChar, manager_mail)
      .query(`
        INSERT INTO MANAGERS (MANAGER_NAME, MANAGER_SURNAME, MANAGER_USERNAME, MANAGER_PASSWORD, MANAGER_MAIL)
        VALUES (@manager_name, @manager_surname, @manager_username, @manager_password, @manager_mail)
      `);

    // ✅ Mail gönderimi
    await sendMail({
      name: manager_name,
      surname: manager_surname,
      username: manager_username,
      email: manager_mail,
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Kayıt hatası:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ✅ TÜM KULLANICILARI GETİR
app.get("/api/users", verifyToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const check = await pool.request()
      .input("id", sql.Int, req.user.id)
      .query("SELECT MANAGER_ID FROM MANAGERS WHERE MANAGER_ID = @id");

    if (check.recordset.length === 0) {
      return res.status(401).json({ message: "Kullanıcı silinmiş veya yetkisiz." });
    }

    const result = await pool.request().query("SELECT * FROM MANAGERS");
    res.json(result.recordset);
  } catch (err) {
    console.error("API /users hatası:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GÜNCELLE
app.put("/api/users/:id", verifyToken, async (req, res) => {
  const { manager_name, manager_surname, manager_username, manager_mail } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .input("name", sql.VarChar, manager_name)
      .input("surname", sql.VarChar, manager_surname)
      .input("username", sql.VarChar, manager_username)
      .input("mail", sql.VarChar, manager_mail)
      .query(`
        UPDATE MANAGERS SET 
          MANAGER_NAME = @name,
          MANAGER_SURNAME = @surname,
          MANAGER_USERNAME = @username,
          MANAGER_MAIL = @mail
        WHERE MANAGER_ID = @id
      `);
    res.json({ success: true });
  } catch (err) {
    console.error("Güncelleme hatası:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ✅ SİL
app.delete("/api/users/:id", verifyToken, async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input("id", sql.Int, req.params.id)
      .query("DELETE FROM MANAGERS WHERE MANAGER_ID = @id");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ SERVER BAŞLAT
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
