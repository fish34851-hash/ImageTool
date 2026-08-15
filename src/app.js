const MAX_FILES = 20
const SUPPORTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const {
  calculateRotatedDimensions,
  calculateTargetDimensions,
  formatBytes,
  makeOutputName,
  normalizeRotation,
} = window.ImageToolCore

const elements = {
  chooseButton: document.querySelector('#choose-button'),
  convertButton: document.querySelector('#convert-button'),
  downloadAllButton: document.querySelector('#download-all-button'),
  dropZone: document.querySelector('#drop-zone'),
  errorMessage: document.querySelector('#error-message'),
  fileInput: document.querySelector('#file-input'),
  fileMeta: document.querySelector('#file-meta'),
  fileName: document.querySelector('#file-name'),
  formatButtons: [...document.querySelectorAll('[data-format]')],
  installButton: document.querySelector('#install-button'),
  maxHeight: document.querySelector('#max-height'),
  maxWidth: document.querySelector('#max-width'),
  networkStatus: document.querySelector('#network-status'),
  previewImage: document.querySelector('#preview-image'),
  previewFrame: document.querySelector('.preview-frame'),
  quality: document.querySelector('#quality'),
  qualityOutput: document.querySelector('#quality-output'),
  qualitySetting: document.querySelector('#quality-setting'),
  resetButton: document.querySelector('#reset-button'),
  resizeEnabled: document.querySelector('#resize-enabled'),
  resizeFields: document.querySelector('#resize-fields'),
  rotationButtons: [...document.querySelectorAll('[data-rotation]')],
  rotationOutput: document.querySelector('#rotation-output'),
  resultBox: document.querySelector('#result-box'),
  resultList: document.querySelector('#result-list'),
  resultSummary: document.querySelector('#result-summary'),
  selectionCount: document.querySelector('#selection-count'),
  shareButton: document.querySelector('#share-button'),
  workspace: document.querySelector('#workspace'),
}

let currentFiles = []
let previewUrl = ''
let resultUrls = []
let outputFormat = 'image/webp'
let rotation = 0
let deferredInstallPrompt = null

function showError(message = '') {
  elements.errorMessage.textContent = message
  elements.errorMessage.classList.toggle('hidden', !message)
}

function clearResults() {
  resultUrls.forEach((url) => URL.revokeObjectURL(url))
  resultUrls = []
  elements.resultList.replaceChildren()
  elements.resultBox.classList.add('hidden')
  elements.downloadAllButton.classList.add('hidden')
  elements.convertButton.classList.remove('hidden')
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('无法读取图片，请尝试其他文件。'))
    image.src = url
  })
}

function updatePreviewRotation() {
  const isQuarterTurn = rotation === 90 || rotation === 270
  const scale = isQuarterTurn
    ? Math.min(1, elements.previewFrame.clientWidth / elements.previewFrame.clientHeight,
      elements.previewFrame.clientHeight / elements.previewFrame.clientWidth)
    : 1
  elements.previewImage.style.transform = `rotate(${rotation}deg) scale(${scale})`
}

function setRotation(value) {
  rotation = normalizeRotation(value)
  elements.rotationOutput.textContent = `${rotation}°`
  elements.rotationButtons.forEach((button) => {
    const isSelected = Number(button.dataset.rotation) === rotation
    button.classList.toggle('is-selected', isSelected)
    button.setAttribute('aria-pressed', String(isSelected))
  })
  updatePreviewRotation()
  clearResults()
}

async function selectFiles(fileList) {
  showError()

  const inputFiles = [...fileList]
  const supportedFiles = inputFiles.filter((file) => SUPPORTED_TYPES.includes(file.type))
  const ignoredCount = inputFiles.length - supportedFiles.length

  if (supportedFiles.length === 0) {
    showError('请选择 PNG、JPG 或 WebP 图片。')
    return
  }

  currentFiles = supportedFiles.slice(0, MAX_FILES)
  clearResults()
  if (previewUrl) URL.revokeObjectURL(previewUrl)

  const firstFile = currentFiles[0]
  previewUrl = URL.createObjectURL(firstFile)
  elements.previewImage.src = previewUrl
  elements.previewImage.alt = `${firstFile.name} 预览`
  elements.fileName.textContent = currentFiles.length === 1
    ? firstFile.name
    : `${firstFile.name} 等 ${currentFiles.length} 张`
  elements.fileName.title = currentFiles.map((file) => file.name).join('\n')
  elements.selectionCount.textContent = currentFiles.length === 1 ? '1 张' : `${currentFiles.length} 张`

  try {
    const image = await loadImage(previewUrl)
    updatePreviewRotation()
    const totalSize = currentFiles.reduce((sum, file) => sum + file.size, 0)
    elements.fileMeta.textContent = `${formatBytes(totalSize)} · 首张 ${image.naturalWidth} × ${image.naturalHeight}`
    elements.dropZone.classList.add('hidden')
    elements.workspace.classList.remove('hidden')
  } catch (error) {
    showError(error.message)
  }

  if (ignoredCount > 0 || supportedFiles.length > MAX_FILES) {
    const notes = []
    if (ignoredCount > 0) notes.push(`已忽略 ${ignoredCount} 个不支持的文件`)
    if (supportedFiles.length > MAX_FILES) notes.push(`一次最多处理 ${MAX_FILES} 张`)
    showError(notes.join('；'))
  }
}

function getResizeLimits() {
  if (!elements.resizeEnabled.checked) return { maxWidth: 0, maxHeight: 0 }
  return {
    maxWidth: Number(elements.maxWidth.value) || 0,
    maxHeight: Number(elements.maxHeight.value) || 0,
  }
}

async function convertFile(file) {
  const sourceUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(sourceUrl)
    const limits = getResizeLimits()
    const rotatedDimensions = calculateRotatedDimensions(image.naturalWidth, image.naturalHeight, rotation)
    const dimensions = calculateTargetDimensions(
      rotatedDimensions.width,
      rotatedDimensions.height,
      limits.maxWidth,
      limits.maxHeight,
    )
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法处理图片。')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    if (outputFormat === 'image/jpeg') {
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    const isQuarterTurn = rotation === 90 || rotation === 270
    const drawWidth = isQuarterTurn ? dimensions.height : dimensions.width
    const drawHeight = isQuarterTurn ? dimensions.width : dimensions.height
    context.save()
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate(rotation * Math.PI / 180)
    context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
    context.restore()

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error('转换失败，请换一种格式后重试。')),
        outputFormat,
        Number(elements.quality.value) / 100,
      )
    })

    return { blob, dimensions, name: makeOutputName(file.name, outputFormat) }
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
}

function renderResult(result) {
  const url = URL.createObjectURL(result.blob)
  resultUrls.push(url)

  const link = document.createElement('a')
  const information = document.createElement('span')
  const name = document.createElement('strong')
  const details = document.createElement('small')
  const downloadLabel = document.createElement('b')

  link.className = 'result-item'
  link.href = url
  link.download = result.name
  name.textContent = result.name
  details.textContent = `${result.dimensions.width} × ${result.dimensions.height} · ${formatBytes(result.blob.size)}`
  downloadLabel.textContent = '下载'
  information.append(name, details)
  link.append(information, downloadLabel)
  elements.resultList.append(link)
}

async function handleConvert() {
  if (currentFiles.length === 0) return
  if (elements.resizeEnabled.checked && !elements.maxWidth.value && !elements.maxHeight.value) {
    showError('请填写最大宽度或最大高度。')
    return
  }

  showError()
  clearResults()
  elements.convertButton.disabled = true

  try {
    let totalOutputSize = 0
    for (const [index, file] of currentFiles.entries()) {
      elements.convertButton.textContent = `正在转换 ${index + 1}/${currentFiles.length}…`
      const result = await convertFile(file)
      totalOutputSize += result.blob.size
      renderResult(result)
    }

    elements.resultSummary.textContent = `${currentFiles.length} 张 · ${formatBytes(totalOutputSize)}`
    elements.convertButton.classList.add('hidden')
    elements.resultBox.classList.remove('hidden')
    elements.downloadAllButton.classList.toggle('hidden', currentFiles.length < 2)
  } catch (error) {
    clearResults()
    showError(error.message)
  } finally {
    elements.convertButton.disabled = false
    elements.convertButton.textContent = '开始转换'
  }
}

function reset() {
  clearResults()
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = ''
  currentFiles = []
  elements.previewImage.removeAttribute('src')
  elements.fileInput.value = ''
  elements.workspace.classList.add('hidden')
  elements.dropZone.classList.remove('hidden')
  setRotation(0)
  showError()
}

elements.chooseButton.addEventListener('click', () => elements.fileInput.click())
elements.fileInput.addEventListener('change', (event) => selectFiles(event.target.files))
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
  selectFiles(event.dataTransfer.files)
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
    clearResults()
  })
})

elements.rotationButtons.forEach((button) => {
  button.addEventListener('click', () => setRotation(button.dataset.rotation))
})

elements.quality.addEventListener('input', () => {
  const value = Number(elements.quality.value)
  elements.qualityOutput.textContent = `${value}%`
  elements.quality.style.setProperty('--range-progress', `${(value - 40) / 0.6}%`)
  clearResults()
})

elements.resizeEnabled.addEventListener('change', () => {
  elements.resizeFields.classList.toggle('hidden', !elements.resizeEnabled.checked)
  clearResults()
})
elements.maxWidth.addEventListener('input', clearResults)
elements.maxHeight.addEventListener('input', clearResults)
window.addEventListener('resize', updatePreviewRotation)

elements.downloadAllButton.addEventListener('click', () => {
  const links = [...elements.resultList.querySelectorAll('a')]
  links.forEach((link, index) => setTimeout(() => link.click(), index * 180))
})

elements.shareButton.addEventListener('click', async () => {
  const shareData = {
    title: 'ImageTool',
    text: '无需上传图片的批量转换与压缩工具',
    url: 'https://fish34851-hash.github.io/ImageTool/',
  }

  try {
    if (navigator.share) await navigator.share(shareData)
    else {
      await navigator.clipboard.writeText(shareData.url)
      elements.shareButton.textContent = '链接已复制'
      setTimeout(() => { elements.shareButton.textContent = '分享' }, 1800)
    }
  } catch (error) {
    if (error.name !== 'AbortError') showError('暂时无法分享，请复制浏览器地址。')
  }
})

function updateNetworkStatus() {
  const isOnline = navigator.onLine
  elements.networkStatus.textContent = isOnline ? '在线' : '离线可用'
  elements.networkStatus.classList.toggle('is-offline', !isOnline)
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault()
  deferredInstallPrompt = event
  elements.installButton.classList.remove('hidden')
})

elements.installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return
  deferredInstallPrompt.prompt()
  await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  elements.installButton.classList.add('hidden')
})

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null
  elements.installButton.classList.add('hidden')
})

window.addEventListener('online', updateNetworkStatus)
window.addEventListener('offline', updateNetworkStatus)
updateNetworkStatus()

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('ImageTool offline support could not be enabled.', error)
    })
  })
}

window.addEventListener('beforeunload', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  resultUrls.forEach((url) => URL.revokeObjectURL(url))
})
