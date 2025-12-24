const User = require("../models/User");

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.status(200).json({ user, status: true, msg: "Profile found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users, status: true, msg: "Users found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!id || !role) return res.status(400).json({ status: false, msg: "Id and role are required" });
    if (!["user", "admin"].includes(role)) return res.status(400).json({ status: false, msg: "Invalid role" });

    const { validateObjectId } = require("../utils/validation");
    if (!validateObjectId(id)) return res.status(400).json({ status: false, msg: "User id not valid" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: false, msg: "User not found" });

    user.role = role;
    await user.save();
    const safe = await User.findById(id).select("-password");
    res.status(200).json({ user: safe, status: true, msg: "User role updated successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}