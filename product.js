const express = require('express')
const router = express.Router()
const { product, addProduct,updateProduct,deleteProduct } = require("../controlles/product.controller")

//Task one see all the product

router.get('/products',product)

//Task 2 add product
router.post("/add-product",addProduct)

//update
router.put("/edit/:id",updateProduct)
router.put("/delete/:id",deleteProduct)

module.exports = router