type Image = cornerstone.Image & {
  data?: any
  imageFrame?: any
}
type PromiseArray<T> = Promise<T>[]
type Stack = {
  currentImageIdIndex: number;
  imageIds: string[];
}
