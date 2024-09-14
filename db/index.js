// db/index.js
const fs = require('fs')
const path = require('path')

// Constants
const PAGE_SIZE = 4096 // Size of each page in bytes
const TABLES_PATH = path.join(__dirname, 'data')

// Ensure the data folder exists
if (!fs.existsSync(TABLES_PATH)) {
  fs.mkdirSync(TABLES_PATH)
}

// Open the table file
const openTable = (tableName) => {
  const tablePath = path.join(TABLES_PATH, `${tableName}.dat`)
  if (!fs.existsSync(tablePath)) {
    fs.writeFileSync(tablePath, Buffer.alloc(PAGE_SIZE)) // Create a new empty page
  }
  return fs.openSync(tablePath, 'r+')
}

// Open the index file
const openIndex = (tableName) => {
  const indexPath = path.join(TABLES_PATH, `${tableName}.idx`)
  if (!fs.existsSync(indexPath)) {
    fs.writeFileSync(indexPath, '{}') // Create an empty JSON object
  }
  const data = fs.readFileSync(indexPath)
  return JSON.parse(data)
}

// Write to the index file
const writeIndex = (tableName, index) => {
  const indexPath = path.join(TABLES_PATH, `${tableName}.idx`)
  fs.writeFileSync(indexPath, JSON.stringify(index))
}

// Helper to find free space in a page
const findFreeSpaceInPage = (fd, pageIndex) => {
  const buffer = Buffer.alloc(PAGE_SIZE)
  fs.readSync(fd, buffer, 0, PAGE_SIZE, PAGE_SIZE * pageIndex)

  // Search the page for empty slots (marked as 0 or null)
  const nullByte = buffer.indexOf(0) // First free byte
  return nullByte === -1 ? null : nullByte
}

// Insert record into a page
const insertRecord = (tableName, record) => {
  const fd = openTable(tableName)
  const index = openIndex(tableName)

  // Serialize the record into a string, then a buffer
  const recordBuffer = Buffer.from(JSON.stringify(record))
  if (recordBuffer.length > PAGE_SIZE) {
    throw new Error('Record exceeds page size')
  }

  // Find free page to insert data
  let pageIndex = Object.keys(index).length
    ? Math.max(...Object.values(index))
    : 0
  let offset = findFreeSpaceInPage(fd, pageIndex)

  if (offset === null || offset + recordBuffer.length > PAGE_SIZE) {
    // No space in this page, move to the next one
    pageIndex++
    offset = 0
  }

  // Write record to the page
  fs.writeSync(
    fd,
    recordBuffer,
    0,
    recordBuffer.length,
    PAGE_SIZE * pageIndex + offset
  )

  // Update the index
  index[record.id] = pageIndex
  writeIndex(tableName, index)

  fs.closeSync(fd)
}

// Find record by ID
const findRecordById = (tableName, id) => {
  const fd = openTable(tableName)
  const index = openIndex(tableName)

  const pageIndex = index[id]
  if (pageIndex === undefined) return null

  const buffer = Buffer.alloc(PAGE_SIZE)
  fs.readSync(fd, buffer, 0, PAGE_SIZE, PAGE_SIZE * pageIndex)

  // Convert buffer back to object
  const recordStr = buffer.toString().replace(/\0/g, '')
  const records = recordStr.split('}{').map((r, i, arr) => {
    if (i === 0) return `${r}}`
    if (i === arr.length - 1) return `{${r}`
    return `{${r}}`
  })

  const record = records.find((r) => JSON.parse(r).id === id)
  fs.closeSync(fd)
  return record ? JSON.parse(record) : null
}

// Update record by ID
const updateRecordById = (tableName, id, updatedRecord) => {
  const record = findRecordById(tableName, id)
  if (!record) return null

  const newRecord = { ...record, ...updatedRecord }
  insertRecord(tableName, newRecord)
  return newRecord
}

// Delete record by ID
const deleteRecordById = (tableName, id) => {
  const fd = openTable(tableName)
  const index = openIndex(tableName)

  const pageIndex = index[id]
  if (pageIndex === undefined) return null

  const buffer = Buffer.alloc(PAGE_SIZE)
  fs.readSync(fd, buffer, 0, PAGE_SIZE, PAGE_SIZE * pageIndex)

  // Mark the record as deleted by writing 0s
  buffer.fill(0, 0, buffer.length)
  fs.writeSync(fd, buffer, 0, buffer.length, PAGE_SIZE * pageIndex)

  // Remove from index
  delete index[id]
  writeIndex(tableName, index)

  fs.closeSync(fd)
}

module.exports = {
  insertRecord,
  findRecordById,
  updateRecordById,
  deleteRecordById,
}
