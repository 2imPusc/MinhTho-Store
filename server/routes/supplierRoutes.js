const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const middleWareController = require('../middlewares/middleWareController');
const { validateSupplierCreate, validateSupplierUpdate } = require('../middlewares/validate');

router.post('/', middleWareController.verifyAdmin, validateSupplierCreate, supplierController.createSupplier);
router.get('/', middleWareController.verifyAdmin, supplierController.getAllSuppliers);
router.get('/:id', middleWareController.verifyAdmin, supplierController.getSupplierById);
router.put('/:id', middleWareController.verifyAdmin, validateSupplierUpdate, supplierController.updateSupplier);
router.delete('/:id', middleWareController.verifyAdmin, supplierController.deleteSupplier);

module.exports = router;