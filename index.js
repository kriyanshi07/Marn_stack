const express = require('express')
const router = express.Router()
const userRouter = require('./user')
const productRoute = require('./product')
const cartRoute=require("./cart")

router.use('/user',userRouter)
router.use('/userProduct',productRoute)
router.use("/cart",cartRoute)

module.exports = router