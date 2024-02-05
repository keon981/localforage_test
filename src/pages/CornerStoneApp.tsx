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
import { wrap } from 'comlink'
import type { saveinIDB } from 'src/utils/worker/loadDicom.worker'
import LocalDicom from 'src/utils/worker/loadDicom.worker?worker'
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

const saveImage = wrap<typeof saveinIDB>(new LocalDicom())

function CornerstoneElement({ stack }: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = new cornerstoneTools.stackRenderers.FusionRenderer()
  const dicomStack = {
    imageIds: [stack.imageIds[0]],
    currentImageIdIndex: 0,
    options: {
      opacity: 1,
      visible: true,
      name: 'base',
    },
  }

  renderer.findImageFn = (imageIds: string[]) => imageIds[0]

  const loadByteArraymage = (byteArray: Uint8Array) => {
    const promise = new Promise<cornerstone.Image>((resolve, reject) => {
      const dataSet = dicomParser.parseDicom(byteArray)
      const image = createImageObject(dataSet)
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

  const init = (id: string) => {
    if (!elementRef.current) return
    const renderRef = elementRef.current
    cornerstone.enable(renderRef, {
      renderer: 'webgl',
    })

    cornerstone
      .loadAndCacheImage(`${baseUrl}${id}`)
      .then(async (image: any) => {
        console.log('updateImage---', image)
        cornerstone.displayImage(renderRef, image)
      })
      .catch((err: any) => console.warn('image--- err', err))

    // cornerstone.getca
  }

  const getDBImage = (itemName: string): Promise<Uint8Array | null> => localforage.getItem(itemName)
    .then((res) => (res as Uint8Array || null))
    .catch((err) => {
      throw err
    })

  const setWadoBase64Image = async (element: HTMLElement, byteArray: Uint8Array) => {
    try {
      // const image = await cornerstone.loadImage(`base64://${base64}`)
      const image = await loadByteArraymage(byteArray).promise
      cornerstone.displayImage(element, image)
      // cornerstone.updateImage(element)
    } catch (error) {
      console.error(error)
    }
  }

  const setImage = async (element: HTMLElement) => {
    try {
      const image = await cornerstone.loadAndCacheImage(`${stack.imageIds[0]}`)
      cornerstone.displayImage(element, image)
      cornerstone.updateImage(element)
      const { byteArray } = image.data
      const msg = await saveImage(`${stack.imageIds[0]}`, image.data.byteArray)
      console.log(msg)
    } catch (error) {
      console.error('err----------', error)
    }
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

  const preloadDicom = async (element: HTMLElement) => {
    try {
      const image = await cornerstone.loadImage(`${stack.imageIds[0]}`)
      const msg = await saveImage(`${stack.imageIds[0]}`, image.data.byteArray)
      cornerstone.displayImage(element, image)
      cornerstone.updateImage(element)
      // await localforage.setItem('dicom', byteArray)
      console.log(msg)
    } catch (error) {
      console.error('err----------', error)
    }
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

      const byteArray = await getDBImage('dicom')
      if (byteArray) {
        // setBase64Image(element)
        console.log('這邊')
        preloadDicom(element)
        // setWadoBase64Image(element, byteArray)
      } else {
        console.log('那邊')
        setImage(element)
      }
    }())
  }, [stack.imageIds])

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
