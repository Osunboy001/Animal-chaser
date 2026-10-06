const mongoose = require('mongoose')

const connectDB = (url) => {
  return mongoose.connect(url)
    .then(() => {
      console.log('MongoDB connected successfully')
    })
    .catch((err) => {
      console.log(' MongoDB connection failed:', err.message)
      throw err
    })
}

module.exports = connectDB