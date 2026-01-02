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

exports.updateAvatar = async (req, res) => {
  try {
    // If file uploaded via multer, use file path
    let avatarUrl = null;
    if (req.file) {
      // store relative path to serve via /uploads
      avatarUrl = `/uploads/avatars/${req.file.filename}`;
    } else if (req.body && req.body.avatar) {
      avatarUrl = req.body.avatar; // fallback (data URL)
    } else {
      return res.status(400).json({ status: false, msg: 'Avatar data required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

    user.avatar = avatarUrl;
    await user.save();

    const safe = await User.findById(req.user.id).select('-password');
    res.status(200).json({ user: safe, status: true, msg: 'Avatar updated successfully' });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
}

exports.removeAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

    const avatar = user.avatar;
    if (avatar && avatar.startsWith('/uploads/avatars/')) {
      const filePath = require('path').resolve(__dirname, '..', avatar.replace('/uploads/', 'uploads/'));
      try { require('fs').unlinkSync(filePath); } catch (e) {}
    }

    user.avatar = null;
    await user.save();

    const safe = await User.findById(req.user.id).select('-password');
    res.status(200).json({ user: safe, status: true, msg: 'Avatar removed' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ status: false, msg: 'Id is required' });
    const { validateObjectId } = require('../utils/validation');
    if (!validateObjectId(id)) return res.status(400).json({ status: false, msg: 'User id not valid' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ status: false, msg: 'User not found' });

    // remove tasks owned/assigned/created by this user
    const Task = require('../models/Task');
    await Task.deleteMany({ $or: [{ user: id }, { assignee: id }, { creator: id }] });

    await user.remove();
    res.status(200).json({ status: true, msg: 'User and related tasks removed successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: 'Internal Server Error' });
  }
}