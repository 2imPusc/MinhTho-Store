const express = require('express')
const router = express.Router();
const middleWareController = require('../middlewares/middleWareController')
const { validateOrderCreate, validateOrderUpdate } = require('../middlewares/validate');
const orderController = require('../controllers/orderController');

// USER
router.get('/my-orders', middleWareController.verifyToken, orderController.getOrderByUser);
router.get('/:id', middleWareController.verifyToken, orderController.getOrderById);

//ADMIN
router.get('/', middleWareController.verifyAdmin, validateOrderCreate,orderController.getAllOrders);
router.post('/', middleWareController.verifyAdmin,  orderController.createOrder);
router.put('/:id', middleWareController.verifyAdmin, validateOrderUpdate,orderController.updateOrder);
router.delete('/:id', middleWareController.verifyAdmin, orderController.deleteOrder);
router.patch('/:id/mark-paid', middleWareController.verifyAdmin, orderController.markPaidOrder);

module.exports = router;