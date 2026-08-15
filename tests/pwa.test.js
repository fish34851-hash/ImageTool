const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'manifest.webmanifest'), 'utf8'))
const serviceWorker = fs.readFileSync(path.join(projectRoot, 'service-worker.js'), 'utf8')

function readPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath)
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG')
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
}

test('web app manifest has installable app metadata', () => {
  assert.equal(manifest.display, 'standalone')
  assert.equal(manifest.start_url, './')
  assert.equal(manifest.scope, './')
  assert.equal(manifest.id, './')
  assert.ok(manifest.name.includes('ImageTool'))
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'any'))
  assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'))
  assert.ok(manifest.icons.some((icon) => icon.type === 'image/png' && icon.sizes === '192x192'))
  assert.ok(manifest.icons.some((icon) => icon.type === 'image/png' && icon.sizes === '512x512'))
})

test('manifest icons exist in the repository', () => {
  manifest.icons.forEach((icon) => {
    const iconPath = icon.src.replace(/^\.\//, '')
    assert.ok(fs.existsSync(path.join(projectRoot, iconPath)), `${iconPath} should exist`)
  })
})

test('raster icons have their declared dimensions', () => {
  const rasterIcons = manifest.icons.filter((icon) => icon.type === 'image/png')
  rasterIcons.forEach((icon) => {
    const [declaredWidth, declaredHeight] = icon.sizes.split('x').map(Number)
    const iconPath = path.join(projectRoot, icon.src.replace(/^\.\//, ''))
    assert.deepEqual(readPngDimensions(iconPath), { width: declaredWidth, height: declaredHeight })
  })
})

test('service worker pre-caches the complete app shell', () => {
  const expectedAssets = [
    './index.html',
    './manifest.webmanifest',
    './src/styles.css',
    './src/core.js',
    './src/app.js',
  ]
  expectedAssets.forEach((asset) => assert.ok(serviceWorker.includes(`'${asset}'`), `${asset} should be cached`))
  assert.match(serviceWorker, /CACHE_NAME = 'imagetool-v0\.4\.0'/)
})
