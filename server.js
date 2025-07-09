const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middlewares/auth");
const sendMail = require("./utils/sendMail");
const pool = require("./db");

const app = express();

// Sabit değerler
const PORT = 5000;
const JWT_SECRET = "supersecretkey123!";
const FRONTEND_URLS = [
  "http://localhost:3000",
  "https://react-node-fullstack.vercel.app"
];

// ✅ CORS ayarı
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || FRONTEND_URLS.some(url => origin.includes(url))) {
      callback(null, true);
    } else {
      callback(new Error("CORS Hatası"));
    }
  },
  credentials: true,
}));

// ✅ JSON parse
app.use(express.json());

// ✅ Preflight (OPTIONS) desteği
app.options("*", cors());

// ✅ Sağlık kontrolü
app.get("/", (req, res) => {
  res.send("API is running.");
});

// ✅ LOGIN endpoint
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT * FROM MANAGERS WHERE MANAGER_USERNAME = $1 AND MANAGER_PASSWORD = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı veya şifre yanlış." });
    }

    const token = jwt.sign(
      { id: result.rows[0].manager_id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      user: result.rows[0],
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// ✅ REGISTER endpoint
app.post("/api/register", async (req, res) => {
  const {
    manager_name,
    manager_surname,
    manager_username,
    manager_password,
    manager_mail,
  } = req.body;

  try {
    const check = await pool.query(
      `SELECT * FROM MANAGERS WHERE MANAGER_NAME = $1 AND MANAGER_SURNAME = $2 AND MANAGER_USERNAME = $3 AND MANAGER_MAIL = $4`,
      [manager_name, manager_surname, manager_username, manager_mail]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ success: false, message: "duplicate" });
    }

    await pool.query(
      `INSERT INTO MANAGERS (MANAGER_NAME, MANAGER_SURNAME, MANAGER_USERNAME, MANAGER_PASSWORD, MANAGER_MAIL)
       VALUES ($1, $2, $3, $4, $5)`,
      [manager_name, manager_surname, manager_username, manager_password, manager_mail]
    );

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

// ✅ SUNUCUYU BAŞLAT
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
