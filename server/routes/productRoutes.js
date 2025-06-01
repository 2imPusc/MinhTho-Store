const express = require('express')
const router = express.Router();
const productController = require('../controllers/productController');
const middleWareController = require('../middlewares/middleWareController')
const { validateProduct } = require('../middlewares/validate');

//PUBLIC
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

//ADMIN
router.post('/', middleWareController.verifyAdmin, validateProduct, productController.createProduct);
router.put('/:id', middleWareController.verifyAdmin, validateProduct, productController.updateProduct);
router.delete('/:id', middleWareController.verifyAdmin, productController.deleteProduct);

module.exports = router;