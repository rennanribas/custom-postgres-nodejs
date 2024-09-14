// controllers/userController.js
const express = require('express')
const userService = require('../services/userService')

const router = express.Router()

router.post('/users', (req, res) => {
  const { name, email } = req.body
  const newUser = userService.createUser(name, email)
  res.status(201).json(newUser)
})

router.get('/users/:id', (req, res) => {
  const user = userService.getUserById(Number(req.params.id))
  res.status(200).json(user)
})

router.put('/users/:id', (req, res) => {
  const { name, email } = req.body
  const updatedUser = userService.updateUser(Number(req.params.id), name, email)
  res.status(200).json(updatedUser)
})

router.delete('/users/:id', (req, res) => {
  const deletedUser = userService.deleteUser(Number(req.params.id))
  res.status(200).json(deletedUser)
})

module.exports = router
