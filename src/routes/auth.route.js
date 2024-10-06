const express = require('express');
const { register, login } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validation.middleware');
const { registerSchema } = require('../utils/auth.validator');

const router = express.Router();

router.post('/register', validate(registerSchema),register);
router.post('/login', login);

module.exports = router;