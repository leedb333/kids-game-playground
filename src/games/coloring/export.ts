export async function exportPng(svg: SVGSVGElement, filename: string) {
  const clone = svg.cloneNode(true) as SVGSVGElement
  // SVG exported through a blob cannot resolve external image references.
  // Inline the same-origin scene; offline requests are served by our PWA cache.
  for (const node of clone.querySelectorAll('image')) {
    const href = node.getAttribute('href')
    if (!href || href.startsWith('data:')) continue
    const url = new URL(href, document.baseURI)
    if (url.origin !== location.origin) throw new Error('Unexpected background origin')
    const response = await fetch(url)
    if (!response.ok) throw new Error('Background unavailable')
    const blob = await response.blob()
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Background conversion failed'))
      reader.readAsDataURL(blob)
    })
    node.setAttribute('href', data)
  }
  const width = 1200
  const height = Math.round(
    (width * svg.viewBox.baseVal.height) / svg.viewBox.baseVal.width,
  )
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.querySelectorAll('[data-guide]').forEach((node) => node.remove())
  clone
    .querySelectorAll('[class]')
    .forEach((node) => node.removeAttribute('class'))
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], {
    type: 'image/svg+xml;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('PNG canvas unavailable')
    context.drawImage(image, 0, 0)
    const png = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value ? resolve(value) : reject(new Error('PNG export failed')),
        'image/png',
      ),
    )
    const downloadUrl = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
  } finally {
    URL.revokeObjectURL(url)
  }
}
