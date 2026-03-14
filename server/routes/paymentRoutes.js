const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const middleWareController = require('../middlewares/middleWareController');

// All payment routes require admin
router.get('/debts', middleWareController.verifyAdmin, paymentController.getAllDebts);
router.get('/customer/:customerId', middleWareController.verifyAdmin, paymentController.getPaymentsByCustomer);
router.get('/customer/:customerId/debt', middleWareController.verifyAdmin, paymentController.getCustomerDebt);
router.post('/', middleWareController.verifyAdmin, paymentController.createPayment);
router.delete('/:id', middleWareController.verifyAdmin, paymentController.deletePayment);

module.exports = router;
