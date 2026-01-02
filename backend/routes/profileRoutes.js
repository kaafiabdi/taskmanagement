const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { getProfile, updateAvatar, removeAvatar } = require("../controllers/profileControllers");
const { verifyAccessToken } = require("../middlewares.js");

// ensure uploads directory exists
const uploadDir = path.resolve(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, uploadDir),
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname);
		cb(null, `${Date.now()}-${Math.random().toString(36).substring(2,8)}${ext}`);
	}
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Routes beginning with /api/profile
router.get("/", verifyAccessToken, getProfile);
// multipart/form-data upload
router.put('/avatar', verifyAccessToken, upload.single('avatar'), updateAvatar);
router.delete('/avatar', verifyAccessToken, removeAvatar);

module.exports = router;