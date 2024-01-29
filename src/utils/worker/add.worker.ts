import { expose } from 'comlink'
import localforage from 'localforage'

type Add = (a: number) => number

const sumFn: Add = (a: number) => a + 4
const sumMoreFn: Add = (a: number) => (a ? a * 2 : a + 2)
export const addFn = (num: number) => num + 1

export const workerScript = (num: number, isAddMore = false) => {
  localforage.setItem(`${num + 1}`, num + 1)
  return isAddMore ? sumMoreFn(num) : sumFn(num)
}

expose(workerScript)
