const express = require("express");
const router = express.Router();
const { getUsers, updateUserRole } = require("../controllers/profileControllers");
const { verifyAccessToken, isAdmin } = require("../middlewares.js");

// Routes beginning with /api/users
router.get("/", verifyAccessToken, isAdmin, getUsers);
router.patch("/:id/role", verifyAccessToken, isAdmin, updateUserRole);

module.exports = router;
