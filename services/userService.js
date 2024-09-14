// services/userService.js
const db = require('../db')

// Create a new user (INSERT)
const createUser = (name, email) => {
  const user = { id: Date.now(), name, email }
  db.insertRecord('users', user)
  return user
}

// Get a user by ID (SELECT)
const getUserById = (id) => {
  const user = db.findRecordById('users', id)
  return user || { message: 'User not found' }
}

// Update a user by ID (UPDATE)
const updateUser = (id, name, email) => {
  const updatedUser = db.updateRecordById('users', id, { name, email })
  return updatedUser || { message: 'User not found' }
}

// Delete a user by ID (DELETE)
const deleteUser = (id) => {
  const result = db.deleteRecordById('users', id)
  return result || { message: 'User not found' }
}

module.exports = {
  createUser,
  getUserById,
  updateUser,
  deleteUser,
}
