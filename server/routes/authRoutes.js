const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const middleWareController = require('../middlewares/middleWareController');
const { validateToken, validateRegister, validateLogin } = require('../middlewares/validate');

//register
router.post('/register', validateRegister, authController.register);

//login
router.post('/login', validateLogin, authController.login);

//logout
router.post('/logout', middleWareController.verifyToken, validateToken, authController.logout);

//refresh-token
router.post('/refresh-token', authController.refreshToken)
module.exports = router;