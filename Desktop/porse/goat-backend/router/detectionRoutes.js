const express = require('express')
  const router = express.Router()

 const {createDetection,getDetection} = require('../controller/detection')

router.route('/create').post( createDetection)
router.route('/getdata').get( getDetection)

module.exports = router