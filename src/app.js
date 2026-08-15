const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const OUTPUT_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

const elements = {
  chooseButton: document.querySelector('#choose-button'),
  convertButton: document.querySelector('#convert-button'),
  downloadButton: document.querySelector('#download-button'),
  dropZone: document.querySelector('#drop-zone'),
  errorMessage: document.querySelector('#error-message'),
  fileInput: document.querySelector('#file-input'),
  fileMeta: document.querySelector('#file-meta'),
  fileName: document.querySelector('#file-name'),
  formatButtons: [...document.querySelectorAll('[data-format]')],
  previewImage: document.querySelector('#preview-image'),
  quality: document.querySelector('#quality'),
  qualityOutput: document.querySelector('#quality-output'),
  qualitySetting: document.querySelector('#quality-setting'),
  resetButton: document.querySelector('#reset-button'),
  resultBox: document.querySelector('#result-box'),
  resultSize: document.querySelector('#result-size'),
  workspace: document.querySelector('#workspace'),
}

let currentFile = null
let previewUrl = ''
let resultUrl = ''
let outputFormat = 'image/webp'

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function makeOutputName(fileName) {
  const baseName = fileName.replace(/\.[^/.]+$/, '') || 'image'
  return `${baseName}-converted.${OUTPUT_EXTENSIONS[outputFormat]}`
}

function showError(message = '') {
  elements.errorMessage.textContent = message
  elements.errorMessage.classList.toggle('hidden', !message)
}

function clearResult() {
  if (resultUrl) URL.revokeObjectURL(resultUrl)
  resultUrl = ''
  elements.downloadButton.removeAttribute('href')
  elements.resultBox.classList.add('hidden')
  elements.convertButton.classList.remove('hidden')
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取这张图片，请尝试其他文件。'))
    image.src = url
  })
}

async function selectFile(file) {
  showError()
  if (!file) return

  if (!SUPPORTED_TYPES.includes(file.type)) {
    showError('暂时只支持 PNG、JPG 和 WebP 图片。')
    return
  }

  clearResult()
  if (previewUrl) URL.revokeObjectURL(previewUrl)

  currentFile = file
  previewUrl = URL.createObjectURL(file)
  elements.previewImage.src = previewUrl
  elements.previewImage.alt = `${file.name} 预览`
  elements.fileName.textContent = file.name
  elements.fileName.title = file.name

  try {
    const image = await loadImage(previewUrl)
    elements.fileMeta.textContent = `${formatBytes(file.size)} · ${image.naturalWidth} × ${image.naturalHeight}`
    elements.dropZone.classList.add('hidden')
    elements.workspace.classList.remove('hidden')
  } catch (error) {
    showError(error.message)
  }
}

function convertImage(file, mimeType, quality) {
  return loadImage(previewUrl).then((image) => {
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight

    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片。')

    if (mimeType === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    context.drawImage(image, 0, 0)

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('转换失败，请换一种输出格式后重试。')),
        mimeType,
        quality,
      )
    })
  })
}

async function handleConvert() {
  if (!currentFile) return

  showError()
  elements.convertButton.disabled = true
  elements.convertButton.textContent = '正在转换…'

  try {
    const blob = await convertImage(currentFile, outputFormat, Number(elements.quality.value) / 100)
    clearResult()
    resultUrl = URL.createObjectURL(blob)
    elements.resultSize.textContent = formatBytes(blob.size)
    elements.downloadButton.href = resultUrl
    elements.downloadButton.download = makeOutputName(currentFile.name)
    elements.convertButton.classList.add('hidden')
    elements.resultBox.classList.remove('hidden')
  } catch (error) {
    showError(error.message)
  } finally {
    elements.convertButton.disabled = false
    elements.convertButton.textContent = '开始转换'
  }
}

function reset() {
  clearResult()
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = ''
  currentFile = null
  elements.previewImage.removeAttribute('src')
  elements.fileInput.value = ''
  elements.workspace.classList.add('hidden')
  elements.dropZone.classList.remove('hidden')
  showError()
}

elements.chooseButton.addEventListener('click', () => elements.fileInput.click())
elements.fileInput.addEventListener('change', (event) => selectFile(event.target.files?.[0]))
elements.resetButton.addEventListener('click', reset)
elements.convertButton.addEventListener('click', handleConvert)

elements.dropZone.addEventListener('dragenter', (event) => {
  event.preventDefault()
  elements.dropZone.classList.add('is-dragging')
})
elements.dropZone.addEventListener('dragover', (event) => event.preventDefault())
elements.dropZone.addEventListener('dragleave', () => elements.dropZone.classList.remove('is-dragging'))
elements.dropZone.addEventListener('drop', (event) => {
  event.preventDefault()
  elements.dropZone.classList.remove('is-dragging')
  selectFile(event.dataTransfer.files?.[0])
})

elements.formatButtons.forEach((button) => {
  button.addEventListener('click', () => {
    outputFormat = button.dataset.format
    elements.formatButtons.forEach((item) => {
      const isSelected = item === button
      item.classList.toggle('is-selected', isSelected)
      item.setAttribute('aria-pressed', String(isSelected))
    })

    const isPng = outputFormat === 'image/png'
    elements.quality.disabled = isPng
    elements.qualitySetting.classList.toggle('is-disabled', isPng)
    elements.qualityOutput.textContent = isPng ? '无损' : `${elements.quality.value}%`
    clearResult()
  })
})

elements.quality.addEventListener('input', () => {
  const value = Number(elements.quality.value)
  elements.qualityOutput.textContent = `${value}%`
  elements.quality.style.setProperty('--range-progress', `${(value - 40) / 0.6}%`)
  clearResult()
})

window.addEventListener('beforeunload', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  if (resultUrl) URL.revokeObjectURL(resultUrl)
})
