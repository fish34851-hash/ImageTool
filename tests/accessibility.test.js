const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8')
const styles = fs.readFileSync(path.join(projectRoot, 'src', 'styles.css'), 'utf8')

test('option controls expose named accessible groups', () => {
  assert.match(html, /id="format-grid" role="group" aria-label="输出格式"/)
  assert.match(html, /id="rotation-grid" role="group" aria-label="旋转图片"/)
})

test('changing application status is announced politely', () => {
  assert.match(html, /id="result-box" role="status" aria-live="polite"/)
  assert.match(html, /id="network-status" role="status" aria-live="polite"/)
})

test('keyboard focus and reduced-motion preferences are visible', () => {
  assert.match(styles, /:focus-visible/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
})
