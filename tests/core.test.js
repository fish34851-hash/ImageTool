const test = require('node:test')
const assert = require('node:assert/strict')
const {
  calculateTargetDimensions,
  formatBytes,
  makeOutputName,
} = require('../src/core.js')

test('formatBytes formats common sizes', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(1024), '1.0 KB')
  assert.equal(formatBytes(10 * 1024), '10 KB')
})

test('makeOutputName replaces the original extension', () => {
  assert.equal(makeOutputName('holiday.photo.png', 'image/webp'), 'holiday.photo-converted.webp')
  assert.equal(makeOutputName('portrait', 'image/jpeg'), 'portrait-converted.jpg')
})

test('calculateTargetDimensions preserves aspect ratio', () => {
  assert.deepEqual(calculateTargetDimensions(4000, 2000, 1000, 1000), { width: 1000, height: 500 })
  assert.deepEqual(calculateTargetDimensions(2000, 4000, 1000, 1000), { width: 500, height: 1000 })
})

test('calculateTargetDimensions accepts a single limit', () => {
  assert.deepEqual(calculateTargetDimensions(2400, 1200, 1200, 0), { width: 1200, height: 600 })
  assert.deepEqual(calculateTargetDimensions(2400, 1200, 0, 300), { width: 600, height: 300 })
})

test('calculateTargetDimensions never upscales', () => {
  assert.deepEqual(calculateTargetDimensions(640, 480, 1920, 1080), { width: 640, height: 480 })
})
