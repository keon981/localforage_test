import { Image } from 'cornerstone-core'
import dicomParser from 'dicom-parser'

const api = 'https://dev.label.efai.tw/api/viewer'

const getMinMax = (storedPixelData: Uint16Array) => {
  let min = storedPixelData[0]
  let max = storedPixelData[0]

  let storedPixel
  const numPixels = storedPixelData.length

  for (let index = 1; index < numPixels; index++) {
    storedPixel = storedPixelData[index]
    min = Math.min(min, storedPixel)
    max = Math.max(max, storedPixel)
  }

  return { min, max }
}
const getImageId = (dataSet: dicomParser.DataSet) => {
  const studyUID = dataSet.string('x0020000d')
  const seriesUID = dataSet.string('x0020000e')
  const objectUID = dataSet.string('x00080018')
  // eslint-disable-next-line max-len
  const imageId = `wadouri:${api}/image/wado?RequestType=wado&studyUID${studyUID}&seriesUID=${seriesUID}&objectUID=${objectUID}`
  return imageId
}

export const createImageObject = (dataSet: dicomParser.DataSet): Image => {
  const photometricInterpretation = dataSet.string('x00280004')
  const isColor = photometricInterpretation === 'RGB' || photometricInterpretation === 'YBR_FULL'
  const invert = photometricInterpretation === 'MONOCHROME1'
  const imageId = getImageId(dataSet)
  const rows = dataSet.uint16('x00280010') as number
  const columns = dataSet.uint16('x00280011') as number
  const pixelSpacing = (dataSet.string('x00280030') as string).split('\\').map(Number)
  const pixelDataElement = dataSet.elements.x7fe00010
  const pixelData = new Uint16Array(dataSet.byteArray.buffer, pixelDataElement.dataOffset)
  const getPixelData = () => pixelData
  const { min, max } = getMinMax(pixelData)
  const intercept = dataSet.floatString('x00281052') || 0
  const slope = dataSet.floatString('x00281053') || 1
  const maxVoi = max * slope + intercept
  const minVoi = min * slope + intercept

  const image = {
    imageId,
    getPixelData,
    color: isColor,
    data: dataSet,
    invert,
    intercept,
    rgba: isColor,
    minPixelValue: min,
    maxPixelValue: max,
    slope,
    windowWidth: dataSet.floatString('x00281051') || (maxVoi - minVoi),
    windowCenter: dataSet.floatString('x00281050') || (maxVoi + minVoi) / 2,
    rows,
    columns,
    height: rows,
    width: columns,
    rowPixelSpacing: pixelSpacing[0],
    columnPixelSpacing: pixelSpacing[1],
    sizeInBytes: pixelData.length * 2,
  }

  return image
}
