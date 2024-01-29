/* eslint-disable jsx-a11y/img-redundant-alt */
import { useEffect, useRef, useState } from 'react'
import { encode } from 'base64-arraybuffer-es6'

import * as cornerstone from 'cornerstone-core'
import * as cornerstoneMath from 'cornerstone-math'
import * as cornerstoneTools from 'cornerstone-tools'
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader'
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import cornerstoneBase64ImageLoader from 'cornerstone-base64-image-loader'
import dicomParser from 'dicom-parser'
import localforage from 'localforage'

cornerstoneTools.external.cornerstone = cornerstone
cornerstoneBase64ImageLoader.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneWebImageLoader.external.cornerstone = cornerstone
cornerstoneWebImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.cornerstoneMath = cornerstoneMath
cornerstoneWADOImageLoader.external.dicomParser = dicomParser

type Props = {
  imageURL: string
}

function ImageToBase64({ imageURL }: Props) {
  const elementRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchImage = async () => {
    // fetch APi
    try {
      const response = await fetch(imageURL)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const byteArray = new Uint8Array(arrayBuffer)

      const base64 = encode(byteArray)
      console.log('Jpeg --', arrayBuffer)

      // eslint-disable-next-line @typescript-eslint/no-shadow
    } catch (err) {
      console.error('err')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const xhrGetImage = () => {
    return new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', imageURL, true)
      xhr.responseType = 'arraybuffer'
      xhr.onload = () => {
        if (xhr.status === 200) {
          const byteArray = xhr.response

          const base64 = encode(byteArray)
          console.log('XMLHttpRequest ---', new Uint8Array(byteArray))
          resolve({ base64, byteArray: new Uint8Array(byteArray) })
        } else {
          const err = new Error(`HTTP error! Status: ${xhr.status}`)
          reject(err)
        }
      }
      xhr.onerror = () => reject(new Error('Network error'))
      xhr.send()
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const loadImageBase64 = async (element: HTMLElement, base64Image: string) => {
    cornerstone
      .loadImage(`base64://${base64Image}`)
      .then(async (image) => {
        cornerstone.enable(element, {
          renderer: 'webgl',
        })
        cornerstone.updateImage(element)
        cornerstone.displayImage(element, image)

        const canvas = image.getCanvas()
        const pngDataURL = canvas.toDataURL('image/png')

        console.log('cornerstone ---', image, pngDataURL)
      })
      .catch((err) => {
        console.error('----------------------- err -----------------------', err)
      })
  }

  const loadDicomBase64 = async (element: HTMLElement, base64Image) => {
    console.log('base64Image')
    await localforage.setItem('02', base64Image.base64)
    // cornerstone
    //   .loadImage(`base64://${base64Image}`)
    //   .then(async (image) => {
    //     cornerstone.enable(element, {
    //       renderer: 'webgl',
    //     })
    //     cornerstone.updateImage(element)
    //     cornerstone.displayImage(element, image)

    //     const canvas = image.getCanvas()
    //     const pngDataURL = canvas.toDataURL('image/png')

    //     console.log('cornerstone ---', image, pngDataURL)
    //   })
    //   .catch((err) => {
    //     console.error('----------------------- err -----------------------', err)
    //   })
  }

  useEffect(() => {
    const element = elementRef.current as HTMLElement
    const awaitFetch = async () => {
      const byteArray = await xhrGetImage()
      await loadDicomBase64(element, byteArray)
    }
    awaitFetch()
  }, [])

  return (
    <div>
      <h2>XMLHttpRequest:</h2>
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

export default ImageToBase64
