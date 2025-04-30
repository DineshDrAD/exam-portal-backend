const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/UserModel");

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
    res.status(200).json({ user, token });
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

    const userData = await userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
    res.status(200).json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getAllUsersData,
  getUserBasedOnId,
  updatePassword,
};
