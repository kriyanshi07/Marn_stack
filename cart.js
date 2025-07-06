const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken');
const {cart,addProductToCart,updateCart,createPaymentSession}=require("../controlles/cart.controller")
const app = express();

app.use(express.json());

//route to get cart
router.get('/Usercart',cart)
router.post("/addcart",addProductToCart)
router.put("/updatecart",updateCart)
router.post("/payment",createPaymentSession)


module.exports = router