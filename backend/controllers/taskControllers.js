const Task = require("../models/Task");
const { validateObjectId } = require("../utils/validation");


exports.getTasks = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, priority, tags } = req.query;

    const filters = [];
    if (req.user.role !== 'admin') {
      filters.push({ $or: [{ user: req.user.id }, { assignee: req.user.id }] });
    }

    if (search) {
      filters.push({ description: { $regex: String(search), $options: 'i' } });
    }

    if (status) {
      filters.push({ status: status });
    }

    if (priority) {
      filters.push({ priority: priority });
    }

    if (tags) {
      const tagsArr = String(tags).split(',').map(t => t.trim()).filter(Boolean);
      if (tagsArr.length) filters.push({ tags: { $in: tagsArr } });
    }

    const finalQuery = filters.length ? { $and: filters } : {};

    const pageNum = Math.max(1, parseInt(page) || 1);
    const perPage = Math.min(100, Math.max(1, parseInt(limit) || 20));

    const total = await Task.countDocuments(finalQuery);
    const tasks = await Task.find(finalQuery)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .populate("assignee", "name email")
      .populate("user", "name email")
      .populate("creator", "name email");

    res.status(200).json({ tasks, total, page: pageNum, perPage, status: true, msg: "Tasks found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.getTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task;
    if (req.user.role === "admin") {
      task = await Task.findById(req.params.taskId).populate("assignee", "name email").populate("user", "name email").populate("creator", "name email");
    }
    else {
      task = await Task.findOne({ _id: req.params.taskId, $or: [{ user: req.user.id }, { assignee: req.user.id }] }).populate("assignee", "name email").populate("user", "name email").populate("creator", "name email");
    }
    if (!task) {
      return res.status(400).json({ status: false, msg: "No task found.." });
    }
    res.status(200).json({ task, status: true, msg: "Task found successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.postTask = async (req, res) => {
  try {
    const { description, userId, title, priority, dueDate, tags } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }
    let owner = req.user.id;

    // If admin creates task for another user, make that user the owner (on-behalf-of)
    if (req.user.role === "admin" && userId) {
      if (!validateObjectId(userId)) return res.status(400).json({ status: false, msg: "User id not valid" });
      const User = require("../models/User");
      const found = await User.findById(userId);
      if (!found) return res.status(400).json({ status: false, msg: "User not found to assign task" });
      owner = userId;
    }

    // normalize tags
    let tagsArr = [];
    if (tags) {
      if (Array.isArray(tags)) tagsArr = tags.map(String);
      else tagsArr = String(tags).split(',').map(t => t.trim()).filter(Boolean);
    }

    const task = await Task.create({ user: owner, description, title: title || '', priority: priority || 'medium', dueDate: dueDate ? new Date(dueDate) : null, tags: tagsArr, creator: req.user.id });
    res.status(200).json({ task, status: true, msg: "Task created successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.putTask = async (req, res) => {
  try {
    const { description, status, title, priority, dueDate, tags } = req.body;

    if (description === undefined && status === undefined && title === undefined && priority === undefined && dueDate === undefined && tags === undefined) {
      return res.status(400).json({ status: false, msg: "No update data provided" });
    }

    if (status && !['pending', 'in-progress', 'completed'].includes(status)) {
      return res.status(400).json({ status: false, msg: "Invalid status value" });
    }

    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return res.status(400).json({ status: false, msg: "Invalid priority value" });
    }

    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(400).json({ status: false, msg: "Task with given id not found" });
    }

    // allow update if owner, assignee or admin
    if (task.user != req.user.id && req.user.role !== "admin" && task.assignee != req.user.id) {
      return res.status(403).json({ status: false, msg: "You can't update this task" });
    }

    const update = {};
    if (description !== undefined) update.description = description;
    if (status !== undefined) update.status = status;
    if (title !== undefined) update.title = title;
    if (priority !== undefined) update.priority = priority;
    if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;
    if (tags !== undefined) {
      if (Array.isArray(tags)) update.tags = tags.map(String);
      else update.tags = String(tags).split(',').map(t => t.trim()).filter(Boolean);
    }

    task = await Task.findByIdAndUpdate(req.params.taskId, update, { new: true });
    res.status(200).json({ task, status: true, msg: "Task updated successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}


exports.deleteTask = async (req, res) => {
  try {
    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(400).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user != req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ status: false, msg: "You can't delete task of another user" });
    }

    await Task.findByIdAndDelete(req.params.taskId);
    res.status(200).json({ status: true, msg: "Task deleted successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.assignTask = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!validateObjectId(req.params.taskId) || !validateObjectId(userId)) {
      return res.status(400).json({ status: false, msg: "Invalid id provided" });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(400).json({ status: false, msg: "Task not found" });

    const User = require("../models/User");
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ status: false, msg: "Assignee user not found" });

    task.assignee = userId;
    await task.save();

    res.status(200).json({ task, status: true, msg: "Task assigned successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}