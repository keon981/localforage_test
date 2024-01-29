/* eslint-disable no-bitwise */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react'

import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
// import cornerstoneBase64ImageLoader from 'cornerstone-base64-image-loader'
import dicomParser from 'dicom-parser'
import localforage from 'localforage'
import { encode, decode } from 'base64-arraybuffer-es6'
import { mask } from '../utils/mask'
import { createImageObject } from '../utils/getImageFrame'

cornerstoneTools.external.cornerstone = cornerstone
// cornerstoneBase64ImageLoader.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.dicomParser = dicomParser
// cornerstoneDICOMImageLoader.webWorkerManager.initialize(config)
// cornerstoneDICOMImageLoader.external.cornerstone = cornerstone

const wadoconfig = {
  webWorkerPath: 'https://api.sisobus.com/share/cornerstoneWADOImageLoaderWebWorker.js',
  taskConfiguration: {
    decodeTask: {
      codecsPath: 'https://api.sisobus.com/share/cornerstoneWADOImageLoaderCodecs.js',
    },
  },
}
cornerstoneWADOImageLoader.webWorkerManager.initialize(wadoconfig)

type Stack = {
  imageIds: string[]
  currentImageIdIndex: number,
}

type Props = {
  stack: Stack
}

type ResponeImage = cornerstone.Image & {
  data: any
  imageFrame: any
}

const baseUrl = 'wadouri:'
const api = 'https://dev.label.efai.tw/api/viewer'

function CornerstoneElement({ stack }: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = new cornerstoneTools.stackRenderers.FusionRenderer()
  const [newImage, setNewImage] = useState({})
  const [images, setImages] = useState({})
  const dicomStack = {
    imageIds: [stack.imageIds[0]],
    currentImageIdIndex: 0,
    options: {
      opacity: 1,
      visible: true,
      name: 'base',
    },
  }

  const base64ToBlob = (base64String: string) => {
    return new Promise((resolve, reject) => {
      const file = new File([base64String], 'image.dicom', { type: 'image/dicom' })
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target) {
          resolve(e.target.result)
        } else {
          reject(new Error('no e.target'))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  renderer.findImageFn = (imageIds: string[]) => imageIds[0]

  const loadBase64Image: cornerstone.ImageLoader = (imageId: string) => {
    const base64 = imageId.replace('base64://', '')
    const arrayBuffer = decode(base64)
    const byteArray = new Uint8Array(arrayBuffer)

    const promise = new Promise<cornerstone.Image>((resolve, reject) => {
      const dataSet = dicomParser.parseDicom(byteArray)
      const image = createImageObject(dataSet)
      if (image) {
        setImages(image)
        resolve(image)
      } else {
        reject(new Error('create Image error'))
      }
    })

    return {
      promise,
    }
  }

  cornerstone.registerImageLoader('base64://', loadBase64Image)

  const init = (id: string) => {
    if (!elementRef.current) return
    const renderRef = elementRef.current
    cornerstone.enable(renderRef, {
      renderer: 'webgl',
    })

    cornerstone
      .loadAndCacheImage(`${baseUrl}${id}`)
      .then(async (image) => {
        console.log('updateImage---', image)
        cornerstone.displayImage(renderRef, image)
      })
      .catch((err) => console.warn('image--- err', err))

    // cornerstone.getca
  }

  const getDBImage = (itemName: string): Promise<string | null> => localforage.getItem(itemName)
    .then((res) => (res ? `${res}` : null))
    .catch((err) => {
      throw err
    })

  const setWadoBase64Image = async (element: HTMLElement, base64: string) => {
    try {
      // const image = await cornerstone.loadImage(`base64://${base64}`)
      const image = await loadBase64Image(`base64://${base64}`).promise
      console.log('setWadoBase64Image--+--', image)

      cornerstone.displayImage(element, image)
      // cornerstone.updateImage(element)
    } catch (error) {
      console.error(error)
    }
  }

  const setImage = (element: HTMLElement) => {
    cornerstone
      .loadAndCacheImage(`${stack.imageIds[0]}`)
      .then(async (image) => {
        const newImage = {
          imageId: image.imageId,
          getPixelData: () => image.getPixelData(),
          color: false,
          floatPixelData: undefined,
          invert: true,
          intercept: 0,
          rgba: false,
          maxPixelValue: 4095,
          minPixelValue: 0,
          slope: 1,
          windowCenter: 2047.5,
          windowWidth: 4095,
          columnPixelSpacing: 0.1,
          rowPixelSpacing: 0.1,
          columns: 2460,
          width: 2460,
          rows: 2970,
          height: 2970,
          sizeInBytes: 14612400,
        }
        setNewImage(newImage)

        // cornerstone.displayImage(element, newImage)
        // cornerstone.updateImage(element)

        const { byteArray } = image.data
        const base64 = encode(byteArray)
        // setWadoBase64Image(element, base64)

        await localforage.setItem('02', base64)
      }).catch((err) => {
        console.error('err----------', err)
      })
  }

  const setBase64Image = (element: HTMLElement) => {
    const maskImageId = `base64://${mask.photo}`
    cornerstone
      .loadImage(maskImageId)
      .then(async (image) => {
        cornerstone.enable(element, {
          renderer: 'webgl',
        })
        cornerstone.updateImage(element)
        cornerstone.displayImage(element, { ...image })

        await localforage.setItem('mask.photo', mask.photo)

        console.log('promise', image)
        // getDBImage(image)
      })
      .catch((err) => {
        console.error('----------------------- err -----------------------', err)
      })
  }

  useEffect(() => {
    console.clear()
    console.log('-----------------------');
    // init Cornerstone
    // init(stack.imageIds[0])
    // eslint-disable-next-line func-names
    (async function () {
      const element = elementRef.current as HTMLElement
      cornerstone.enable(element, {
        renderer: 'webgl',
      })
      const base64 = await getDBImage('02')
      if (base64) {
        // setBase64Image(element)
        setWadoBase64Image(element, base64)
        setImage(element)
      } else {
        setImage(element)
      }
    }())
  }, [stack.imageIds])

  useEffect(() => {
    console.table([images, newImage])
  }, [images, newImage])

  return (
    <div>
      <h2>cornerStone:</h2>
      <div
        className="viewportElement"
        ref={elementRef}
        style={{
          width: '514px',
          height: '514px',
        }}
      >
        <canvas ref={canvasRef} className="cornerstone-canvas" />
      </div>
    </div>
  )
}

export default CornerstoneElement
