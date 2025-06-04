const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");
const { Readable } = require("stream");
const userModel = require("../models/userModel");

const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (role !== "student" && role !== "evaluator") {
      return res.status(400).json({ error: "Invalid role" });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }
    if (password.length < 3) {
      return res
        .status(400)
        .json({ error: "Password must be at least 3 characters long" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await userModel.create({
      username,
      email,
      password: hashedPassword,
      role,
    });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );
    await userModel.findByIdAndUpdate(user._id, { sessionToken: token });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      // maxAge: 1000 * 60 * 60 * 24,
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const bulkCreateUsers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const users = XLSX.utils.sheet_to_json(sheet);

    const insertedUsers = [];

    for (const user of users) {
      const { username, email, password, role } = user;
      if (
        typeof username !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string" ||
        typeof role !== "string" ||
        !username.trim() ||
        !email.trim() ||
        !password.trim() ||
        !role.trim()
      ) {
        continue;
      }

      const existing = await userModel.findOne({ email });
      if (existing) continue;

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new userModel({
        username,
        email,
        password: hashedPassword,
        role: role.toLowerCase(),
      });

      await newUser.save();
      insertedUsers.push(newUser);
    }

    res
      .status(200)
      .json({ message: "Users added", count: insertedUsers.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllUsersData = async (req, res) => {
  try {
    const usersData = await userModel.find().select("-password");
    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserBasedOnId = async (req, res) => {
  try {
    const { userId } = req.params;
    const usersData = await userModel.findById(userId).select("-password");
    if (!usersData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(usersData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { userId } = req.params;
    if (!userId || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password.length < 3) {
      return res
        .status(400)
        .json({ error: "Password must be at least 3 characters long" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = await userModel
      .findByIdAndUpdate(userId, {
        password: hashedPassword,
      })
      .select("-password");
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserData = async (req, res) => {
  try {
    const userData = await userModel.findById(req.user._id).select("-password");
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    await userModel.findByIdAndUpdate(req.user._id, { sessionToken: null });
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      path: "/",
    });
    res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const downloadUserTemplate = (req, res) => {
  const worksheetData = [
    ["username", "email", "password", "role"],
    ["JohnDoe", "john@example.com", "123456", "student"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Users");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=UserTemplate.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  stream.pipe(res);
};

module.exports = {
  registerUser,
  loginUser,
  bulkCreateUsers,
  getAllUsersData,
  getUserBasedOnId,
  updatePassword,
  logoutUser,
  getUserData,
  downloadUserTemplate,
};
