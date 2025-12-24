const Task = require("../models/Task");
const { validateObjectId } = require("../utils/validation");


exports.getTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "admin") {
      query = {};
    }
    else {
      query = { $or: [{ user: req.user.id }, { assignee: req.user.id }] };
    }
    const tasks = await Task.find(query).populate("assignee", "name email").populate("user", "name email");
    res.status(200).json({ tasks, status: true, msg: "Tasks found successfully.." });
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
      task = await Task.findById(req.params.taskId).populate("assignee", "name email").populate("user", "name email");
    }
    else {
      task = await Task.findOne({ _id: req.params.taskId, $or: [{ user: req.user.id }, { assignee: req.user.id }] }).populate("assignee", "name email").populate("user", "name email");
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
    const { description, userId } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }
    let owner = req.user.id;
    if (req.user.role === "admin" && userId) {
      if (!validateObjectId(userId)) return res.status(400).json({ status: false, msg: "User id not valid" });
      const User = require("../models/User");
      const found = await User.findById(userId);
      if (!found) return res.status(400).json({ status: false, msg: "User not found to assign task" });
      owner = userId;
    }

    const task = await Task.create({ user: owner, description });
    res.status(200).json({ task, status: true, msg: "Task created successfully.." });
  }
  catch (err) {
    console.error(err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
}

exports.putTask = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ status: false, msg: "Description of task not found" });
    }

    if (!validateObjectId(req.params.taskId)) {
      return res.status(400).json({ status: false, msg: "Task id not valid" });
    }

    let task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(400).json({ status: false, msg: "Task with given id not found" });
    }

    if (task.user != req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ status: false, msg: "You can't update task of another user" });
    }

    task = await Task.findByIdAndUpdate(req.params.taskId, { description }, { new: true });
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