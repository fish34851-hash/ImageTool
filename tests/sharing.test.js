const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath)
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

test('link previews use an absolute social image', () => {
  assert.match(html, /property="og:title"/)
  assert.match(html, /property="og:description"/)
  assert.match(html, /property="og:image" content="https:\/\/fish34851-hash\.github\.io\/ImageTool\/assets\/social-preview\.png"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
})

test('social preview has the declared dimensions', () => {
  const imagePath = path.join(projectRoot, 'assets', 'social-preview.png')
  assert.ok(fs.existsSync(imagePath), 'social-preview.png should exist')
  assert.deepEqual(readPngDimensions(imagePath), { width: 1200, height: 630 })
})
