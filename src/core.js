(function exposeImageToolCore(root, factory) {
  const api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.ImageToolCore = api
}(typeof globalThis !== 'undefined' ? globalThis : this, function createImageToolCore() {
  const outputExtensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB']
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    const value = bytes / 1024 ** unitIndex
    return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
  }

  function makeOutputName(fileName, mimeType) {
    const baseName = String(fileName || 'image').replace(/\.[^/.]+$/, '') || 'image'
    const extension = outputExtensions[mimeType] || 'png'
    return `${baseName}-converted.${extension}`
  }

  function normalizeRotation(rotation) {
    const normalized = ((Number(rotation) || 0) % 360 + 360) % 360
    return [0, 90, 180, 270].includes(normalized) ? normalized : 0
  }

  function calculateRotatedDimensions(width, height, rotation = 0) {
    const safeWidth = Math.max(1, Number(width) || 1)
    const safeHeight = Math.max(1, Number(height) || 1)
    const normalizedRotation = normalizeRotation(rotation)
    const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270

    return isQuarterTurn
      ? { width: safeHeight, height: safeWidth }
      : { width: safeWidth, height: safeHeight }
  }

  function calculateTargetDimensions(width, height, maxWidth = 0, maxHeight = 0) {
    const safeWidth = Math.max(1, Number(width) || 1)
    const safeHeight = Math.max(1, Number(height) || 1)
    const widthLimit = Number(maxWidth) > 0 ? Number(maxWidth) : Infinity
    const heightLimit = Number(maxHeight) > 0 ? Number(maxHeight) : Infinity
    const scale = Math.min(1, widthLimit / safeWidth, heightLimit / safeHeight)

    return {
      width: Math.max(1, Math.round(safeWidth * scale)),
      height: Math.max(1, Math.round(safeHeight * scale)),
    }
  }

  return {
    calculateRotatedDimensions,
    calculateTargetDimensions,
    formatBytes,
    makeOutputName,
    normalizeRotation,
  }
}))
