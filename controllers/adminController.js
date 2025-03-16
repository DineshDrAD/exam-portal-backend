const userModel = require("../models/UserModel");
const sendMail = require("../utils/sendMail");

const triggerMail = async (req, res) => {
  try {
    const { receivers, body, subject } = req.body;

    const receiptentsData = await userModel
      .find({ role: receivers })
      .select("email");

    const receiptentsEmails = receiptentsData.map((data) => data.email);

    await sendMail(receiptentsEmails, subject, body, body);

    res.status(200).json({
      success: true,
      message: "Mail sent successfully!",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to send the mail",
    });
  }
};

module.exports = { triggerMail };
