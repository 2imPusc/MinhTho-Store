const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const middleWareController = require('../middlewares/middleWareController');
const { validateCustomerCreate, validateCustomerUpdate } = require('../middlewares/validate');

// All customer routes require admin
router.get('/', middleWareController.verifyAdmin, customerController.getAllCustomers);
router.get('/:id', middleWareController.verifyAdmin, customerController.getCustomerById);
router.post('/', middleWareController.verifyAdmin, validateCustomerCreate, customerController.createCustomer);
router.put('/:id', middleWareController.verifyAdmin, validateCustomerUpdate, customerController.updateCustomer);
router.post('/bulk-delete', middleWareController.verifyAdmin, customerController.bulkDelete);
router.delete('/:id', middleWareController.verifyAdmin, customerController.deleteCustomer);

module.exports = router;
