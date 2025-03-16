const { transporter } = require("./MailTransporter");

const sendMail = async (recipientEmail, subject, text, html) => {
  const mailOptions = {
    from: '"Nithish" nithish.2153036@srec.ac.in',
    to: recipientEmail.join(","),
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email: ", error);
  }
};

module.exports = sendMail;
