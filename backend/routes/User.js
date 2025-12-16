const router = require('express').Router()
const userController = require('../controller/User')

router.put('/update/:id', userController.update)

module.exports = router