type CropAreaPixels = {
  width: number
  height: number
  x: number
  y: number
}

function createImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageUrl
    image.onload = () => resolve(image)
    image.onerror = (error) => reject(error)
  })
}

export async function getCroppedImageBlob(
  imageUrl: string,
  crop: CropAreaPixels,
  outputType = 'image/jpeg',
): Promise<Blob> {
  const image = await createImage(imageUrl)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to create canvas context for cropping.')
  }

  canvas.width = crop.width
  canvas.height = crop.height

  context.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate cropped image.'))
        return
      }

      resolve(blob)
    }, outputType)
  })
}
