import { expose } from 'comlink'
import localforage from 'localforage'

type Add = (a: number) => number
type CbFn = (value: string | number) => Promise<void>
const sumFn: Add = (a: number) => a + 4
const sumMoreFn: Add = (a: number) => (a ? a * 2 : a + 2)
export const addFn = (num: number) => num + 1

export const workerScript = (num: number, isAddMore = false) => {
  localforage.setItem(`${num + 1}`, num + 1)
  return isAddMore ? sumMoreFn(num) : sumFn(num)
}

export async function remoteFunction(cb: CbFn) {
  await cb('A string from a worker')
}

// expose(workerScript)
expose(remoteFunction)
