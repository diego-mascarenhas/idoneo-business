export const PROFILE_PHOTO_SIZE = 512
export const PROFILE_PHOTO_MAX_BYTES = 12 * 1024 * 1024

export async function loadProfilePhotoBitmap(source: Blob): Promise<ImageBitmap> {
  if (source.size > PROFILE_PHOTO_MAX_BYTES) {
    throw new Error('La foto es demasiado grande. Usá una de hasta 12 MB.')
  }

  try {
    return await createImageBitmap(source)
  } catch {
    throw new Error('Ese archivo no se pudo leer. Probá un JPG o PNG.')
  }
}

export async function exportProfilePhoto(
  bitmap: ImageBitmap,
  crop: { sx: number; sy: number; sw: number; sh: number },
): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = PROFILE_PHOTO_SIZE
  canvas.height = PROFILE_PHOTO_SIZE
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('No se pudo preparar la foto.')
  }

  context.drawImage(bitmap, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, PROFILE_PHOTO_SIZE, PROFILE_PHOTO_SIZE)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (next) => (next ? resolve(next) : reject(new Error('No se pudo preparar la foto.'))),
      'image/jpeg',
      0.86,
    )
  })

  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
}
