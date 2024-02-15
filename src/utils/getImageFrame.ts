/* eslint-disable max-len */
/* eslint-disable no-plusplus */
import dicomParser from 'dicom-parser'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const api = 'https://dev.label.efai.tw/api/viewer'

type TypeArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | Uint8ClampedArray

type TypeArrayConstructor =
  | typeof Int8Array
  | typeof Uint8Array
  | typeof Uint8ClampedArray
  | typeof Int16Array
  | typeof Uint16Array
  | typeof Int32Array
  | typeof Uint32Array
  | typeof Float32Array
  | typeof Float64Array

type GetPixelArrayType = (bitsAllocated: number, pixelRepresentation: number) => TypeArrayConstructor

const getMinMax = (pixelData: TypeArray) => {
  let min = pixelData[0]
  let max = pixelData[0]

  for (let index = 1; index < pixelData.length; index++) {
    const modalityPixelValue = pixelData[index]
    if (modalityPixelValue > max) {
      max = modalityPixelValue
    }
    if (modalityPixelValue < min) {
      min = modalityPixelValue
    }
  }

  return { min, max }
}

const getPerPixel = (photometricInterpretation: string) => {
  if (photometricInterpretation === 'MONOCHROME1'
    || photometricInterpretation === 'MONOCHROME2'
    || photometricInterpretation === 'PALETTE COLOR') {
    return 1
  } if (photometricInterpretation === 'RGB'
    || photometricInterpretation === 'YBR_FULL'
    || photometricInterpretation === 'YBR_FULL_422'
    || photometricInterpretation === 'YBR_PARTIAL_422'
    || photometricInterpretation === 'YBR_PARTIAL_420') {
    return 3
  } if (photometricInterpretation === 'ARGB' || photometricInterpretation === 'RGBA') {
    return 4
  }
  return 1
}

const getPixelArrayType: GetPixelArrayType = (bitsAllocated, pixelRepresentation) => {
  switch (bitsAllocated) {
    case 8:
      return Uint8Array
    case 16:
      return pixelRepresentation ? Int16Array : Uint16Array
    case 32:
      return Float32Array
    default:
      return Uint8Array
  }
}

const getColorPixelData = (imageFrame: TypeArray) => {
  const targetBuffer: Uint8ClampedArray = new Uint8ClampedArray((imageFrame.length / 3) * 4)
  const numPixels = imageFrame.length / 3
  let rgbIndex = 0
  let bufferIndex = 0

  for (let i = 0; i < numPixels; i++) {
    targetBuffer[bufferIndex++] = imageFrame[rgbIndex++] // red
    targetBuffer[bufferIndex++] = imageFrame[rgbIndex++] // green
    targetBuffer[bufferIndex++] = imageFrame[rgbIndex++] // blue
    targetBuffer[bufferIndex++] = 255 // alpha
  }

  return targetBuffer
}

const createImageObject = (dataSet: dicomParser.DataSet, imageUrl: string) => {
  const { buffer } = dataSet.byteArray
  const photometricInterpretation = dataSet.string('x00280004') as string
  const isColor = !(/MONOCHROME(1|2)?/i).test(photometricInterpretation)
  const invert = photometricInterpretation === 'MONOCHROME1'
  const rows = dataSet.uint16('x00280010') as number
  const columns = dataSet.uint16('x00280011') as number
  const pixelSpacingString = dataSet.string('x00280030')
  const pixelSpacing = pixelSpacingString ? pixelSpacingString.split('\\').map(Number) : [1, 1]
  const { dataOffset = 0 } = dataSet.elements.x7fe00010
  const perPixel = getPerPixel(photometricInterpretation)
  const samplesPerPixel = perPixel < 3 ? perPixel : 4

  // pixelData
  const bitsAllocated = dataSet.uint16('x00280100') as number
  const pixelRepresentation = dataSet.uint16('x00280103') as number
  const PixelArrayType = getPixelArrayType(bitsAllocated, pixelRepresentation)
  const defaultPixelData = new PixelArrayType(buffer, dataOffset)
  const colorPixelData = getColorPixelData(defaultPixelData)
  const pixelData = isColor ? colorPixelData : defaultPixelData
  const getPixelData = () => pixelData
  const sizeInBytes = rows * columns * samplesPerPixel

  const intercept = dataSet.floatString('x00281052') || 0
  const slope = dataSet.floatString('x00281053') || 1

  // pixelValue
  const { min, max } = getMinMax(pixelData)
  const minPixelValue = dataSet.uint16('x00280106') || min
  const maxPixelValue = dataSet.uint16('x00280107') || max

  // window
  const maxVoi = maxPixelValue * slope + intercept
  const minVoi = minPixelValue * slope + intercept
  const windowWidth = dataSet.floatString('x00281051') || maxVoi - minVoi
  const windowCenter = dataSet.floatString('x00281050') || (maxVoi + minVoi) / 2

  const imageObject = {
    imageId: imageUrl,
    minPixelValue,
    maxPixelValue,
    slope,
    intercept,
    windowCenter,
    windowWidth,
    getPixelData,
    getCanvas() {
      const canvas = document.createElement('canvas')
      canvas.height = rows
      canvas.width = columns
      return canvas
    },
    rows,
    columns,
    height: rows,
    width: columns,
    columnPixelSpacing: pixelSpacing[1] || 1,
    rowPixelSpacing: pixelSpacing[0] || 1,
    color: isColor,
    rgba: isColor,
    invert,
    sizeInBytes,
    data: dataSet,
    imageFrame: {
      bitsAllocated,
      photometricInterpretation,
      pixelRepresentation,
      pixelData,
      pixelDataLength: isColor ? rows * columns * 3 : dataSet.byteArray.length,
      rows,
      columns,
      samplesPerPixel: perPixel,
    },
  }

  return imageObject
}

export const loadByteArrayImage = (byteArray: Uint8Array, imageUrl: string) => {
  const promise = new Promise<cornerstone.Image>((resolve, reject) => {
    const dataSet = dicomParser.parseDicom(byteArray)
    const image = createImageObject(dataSet, imageUrl)
    if (image) {
      resolve(image)
    } else {
      reject(new Error('create Image error'))
    }
  })

  return {
    promise,
  }
}
