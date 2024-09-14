// app.js
const express = require('express')
const bodyParser = require('body-parser')
const userController = require('./controllers/userController')

const app = express()

app.use(bodyParser.json())
app.use('/api', userController)

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
