const nodemailer = require("nodemailer");

const sendMail = async ({ name, surname, username, email }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "tolgabasar406@gmail.com",
      pass: "hkxdlbogwapficxd",
    },
  });

  const mailOptions = { from: '"Kayıt Sistemi 👤" <tolgabasar406@gmail.com>', to: "tolga.basar@nextstation.com.tr,onurcan.canca@nextstation.com.tr",  subject: "Yeni Kullanıcı Kaydı Yapıldı",
    html: `
      <h2>Yeni Kullanıcı Kaydı</h2>
      <p><strong>Ad:</strong> ${name}</p>
      <p><strong>Soyad:</strong> ${surname}</p>
      <p><strong>Kullanıcı Adı:</strong> ${username}</p>
      <p><strong>Email:</strong> ${email}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Mail gönderildi");
  } catch (error) {
    console.error("❌ Mail gönderme hatası:", error);
  }
};

module.exports = sendMail;
