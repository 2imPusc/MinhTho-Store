const express = require('express')
const router = express.Router();
const middleWareController = require('../middlewares/middleWareController')
const orderController = require('../controllers/orderController');

// ADMIN
router.get('/', middleWareController.verifyAdmin, orderController.getAllOrders);
router.get('/customer/:customerId', middleWareController.verifyAdmin, orderController.getOrdersByCustomer);
router.get('/:id', middleWareController.verifyAdmin, orderController.getOrderById);
router.post('/', middleWareController.verifyAdmin, orderController.createOrder);
router.put('/:id/payment', middleWareController.verifyAdmin, orderController.addPayment);
router.patch('/:id/mark-paid', middleWareController.verifyAdmin, orderController.markPaidOrder);
router.delete('/:id', middleWareController.verifyAdmin, orderController.deleteOrder);

module.exports = router;
