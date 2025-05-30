const jwt = require('jsonwebtoken');

const middleWareController = {
  // Middleware xác thực token
  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Không có token.' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
      if (err) {
        return res.status(403).json({ message: 'Token không hợp lệ.' });
      }
      req.user = user;
      next();
    });
  },

  // Middleware kiểm tra token và vai trò là admin
  verifyAdmin: (req, res, next) => {
    middleWareController.verifyToken(req, res, () => {
      if (req.user.role === 'admin') {
        next();
      } else {
        return res.status(403).json({ message: 'Bạn không có quyền truy cập.' });
      }
    });
  },

  // Middleware cho phép chính user hoặc admin
  verifyTokenAndSelfOrAdmin: (req, res, next) => {
    middleWareController.verifyToken(req, res, () => {
      if (req.user.role === 'admin' || req.user.id === req.params.id) {
        next();
      } else {
        return res.status(403).json({ message: 'Bạn không được phép thực hiện hành động này.' });
      }
    });
  }
};

module.exports = middleWareController;
