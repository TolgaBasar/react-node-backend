require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middlewares/auth");
const sendMail = require("./utils/sendMail");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123!";

// 🔴 CORS fix middleware – En üste
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://react-node-fullstack-fjk5.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// ✅ Normal CORS middleware
app.use(
  cors({
    origin: "https://react-node-fullstack-fjk5.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.options("*", cors()); // Preflight için

// 🟢 LOGIN
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

    const token = jwt.sign({ id: result.rows[0].manager_id }, JWT_SECRET, {
      expiresIn: "1h",
    });

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

// 🟢 REGISTER
app.post("/api/register", async (req, res) => {
  const { manager_name, manager_surname, manager_username, manager_password, manager_mail } = req.body;
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

// ✅ Sağlık kontrolü için kök route
app.get("/", (req, res) => {
  res.send("API is running.");
});

// ✅ Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
