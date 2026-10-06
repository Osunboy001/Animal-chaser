
require('dotenv').config()
const express = require('express');
const app = express()
const cors = require('cors');
const connectDB = require('./db/db')
app.use(cors());     
app.use(express.urlencoded({extended: true}));
app.use(express.json({ limit: '10mb' }));


app.use(express.static('./public'))


const detection = require('./router/detectionRoutes')
app.use('/api/v1/detection', detection)

const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

const port = process.env.PORT || 3000

const start = async ()=> {

    try{
    console.log(" Connecting to MongoDB...")
    console.log("MONGO_URI:", process.env.MONGO_URI  ? "Set" : " Missing")
  
    await connectDB(process.env.MONGO_URI)
    console.log("MongoDB connected!")

    app.listen(port, () => {
        console.log(`server is loading at ${port}`)
    })
    }

    catch (error) {
        console.log("Error:", error.message)
    process.exit(1)

    }




}
start()

