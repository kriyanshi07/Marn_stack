const express = require('express')
const { signup , login} = require('../controlles/user.controller')
const router = express.Router()


router.post('/register',signup)

//login router
router.post('/login',login)

module.exports = router