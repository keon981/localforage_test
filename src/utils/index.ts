import type { Dicom } from 'src/utils/API'
import {
  composeSeriesData, fetchDicomInstances, fetchProjectInfo, composeDicomList, getUserToken,
} from 'src/utils/API'

export const getAllDicomList = async (id: string | number): Promise<Dicom[]> => {
  try {
    const { token } = await getUserToken()
    const info = await fetchProjectInfo(token, id)
    const studyList = await fetchDicomInstances(info.studyid)
    const seriesList = await composeSeriesData(studyList)
    const dicomList = composeDicomList(seriesList)
    return dicomList
  } catch (error) {
    const err = error instanceof Error ? error.message : 'new Error'
    throw new Error(err)
  }
}
