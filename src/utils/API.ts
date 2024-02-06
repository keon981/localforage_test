// eslint-disable-next-line import/no-extraneous-dependencies
import axios from 'axios'

const LABEL_API_URL = 'https://dev.label.efai.tw/api/label'
const VIEWER_API_URL = 'https://dev.label.efai.tw/api/viewer'

interface UserOutput {
  token: string;
  token_exp: number;
  token_iat: number;
  token_iss: string;
  user_account: string;
  user_email: string;
  user_id: number;
  user_name: string;
  user_type: number;
}

export interface Dicom {
  image_id: string;
  image_url: string;
  dicom_name?: string;
  labels?: string;
  instance_number: number;
  thumbnail?: string;
}

interface SeriesData {
  thumbnail: string;
  study_id: string;
  series_name?: string;
  patient_sex?: string;
  series_description?: string;
  series_id: string;
  patient_age?: number;
  patient_name?: any;
  dicom_list: Dicom[];
  study_description?: string;
  series_number?: number;
}

const seriesTag = {
  studyID: '0020000D',
  seriesID: '0020000E',
  wadouri: '00081190',
  PatientID: '00100020',
  PatientName: '00100010',
  PatientSex: '00100040',
  PatientAge: '00101010',
  seriesName: '0008103E',
  imageID: '00080018',
  StudyDate: '00080020',
  StudyDescription: '00081030',
  SeriesTime: '00080031',
  SeriesDate: '00080021',
  InstanceNumber: '00200013',
  SeriesNumber: '00200011',
}

export async function getUserToken(): Promise<UserOutput> {
  const res = await axios({
    method: 'POST',
    url: `${LABEL_API_URL}/native/login`,
    data: {
      account: 'efai@mail.com',
      password: '123456',
    },
  })
  return res.data
}

export async function fetchProjectInfo(token: string, workerListId: string | number) {
  const res = await axios({
    headers: {
      'Content-Type': 'application/json;',
      Authorization: `Bearer ${token}`,
    },
    method: 'GET',
    url: `${LABEL_API_URL}/label/${workerListId}`,
    // url: "http://192.168.5.99:3000/study",
  })
  return res.data
}

export async function fetchDicomInstances(study: string) {
  const includefield: string[] = Object.values(seriesTag)
  const res = await axios({
    headers: {
      'Content-Type': 'application/json;',
    },
    method: 'GET',
    url: `${VIEWER_API_URL}/image/rs/studies/${study}/instances?${includefield
      .map((tag) => `includefield=${tag}`)
      .join('&')}`,
  })
  return res.data
}

const getDicomInsertPosition = (dicom_list: Dicom[], dicom: Dicom) => {
  const instanceNumber: number = dicom.instance_number
  for (let i = 0; i < dicom_list.length; i++) {
    if (Number(instanceNumber) < Number(dicom_list[i].instance_number)) return i
  }
  return dicom_list.length
}

const getSeriesInsertPosition = (series_list: SeriesData[], series: SeriesData) => {
  const seriesNumber = series.series_number as number
  for (let i = 0; i < series_list.length; i++) {
    if (seriesNumber < (series_list[i].series_number as number)) return i
  }
  return series_list.length
}

export const composeSeriesData = async (instances: SeriesData[]) => {
  const tempSeriesData: SeriesData[] = []
  let studyDescription: string = ''

  if (instances.length !== 0) {
    studyDescription = (instances[0] as any)[seriesTag.StudyDescription].Value[0]
  }

  instances.sort((a, b) => a[seriesTag.seriesID].Value[0] - b[seriesTag.seriesID].Value[0])
  // console.log("stack-scroll  - instance", instances);
  for (let i = 0; i < instances.length; i++) {
    const instance: any = instances[i]
    const studyID: string = instance[seriesTag.studyID].Value[0]
    const seriesID: string = instance[seriesTag.seriesID].Value[0]
    const imageID: string = instance[seriesTag.imageID].Value[0]
    const wadouri: string = instance[seriesTag.wadouri].Value[0]
    const patientname: string = instance[seriesTag.PatientName].Value[0]
    const patientage: number = instance[seriesTag.PatientAge].Value[0]
    const seriesdescription: string = instance[seriesTag.StudyDescription].Value[0]
    const patientsex: string = instance[seriesTag.PatientSex].Value[0]
    const instanceNumber: number = instance[seriesTag.InstanceNumber]?.Value[0]
    const seriesNumber: number = instance[seriesTag.SeriesNumber]?.Value[0]
    const seriesName: string = `Ser${seriesNumber}`
    // instance["0008103E"].Value[0] ==> this is series description, not series name

    const thumbnail: string = `${VIEWER_API_URL}/image/rs/studies/${studyID}/series/${seriesID}/thumbnail`
    // local thumnail
    // const thumbnail: string = instance.thumbnail.Value[0];

    let hasInSeriesList: boolean = false

    for (let i = 0; i < tempSeriesData.length; i++) {
      if (tempSeriesData[i].series_id === seriesID) {
        const dicom: Dicom = {
          image_id: imageID,
          image_url: wadouri,
          instance_number: instanceNumber,
          thumbnail,
        }
        const insertPosition: number = getDicomInsertPosition(tempSeriesData[i].dicom_list, dicom)
        tempSeriesData[i].dicom_list.splice(insertPosition, 0, dicom)
        hasInSeriesList = true
        break
      }
    }

    if (!hasInSeriesList) {
      const series: SeriesData = {
        study_id: studyID,
        series_name: seriesName || '',
        series_id: seriesID,
        thumbnail,
        patient_name: patientname,
        patient_age: patientage,
        patient_sex: patientsex,
        series_description: seriesdescription,
        series_number: seriesNumber,
        dicom_list: [
          {
            image_id: imageID,
            image_url: wadouri,
            instance_number: instanceNumber,
            thumbnail,
          },
        ],
      }
      const insertPosition: number = getSeriesInsertPosition(tempSeriesData, series)
      tempSeriesData.splice(insertPosition, 0, series)
    }
  }
  // composeFilesList(tempSeriesData);
  return tempSeriesData
}

export const composeDicomList = (tempSeriesData: SeriesData[]) => {
  console.log('tempSeriesData---', tempSeriesData)

  const newList: Dicom[] = []
  tempSeriesData.forEach(({ dicom_list }) => {
    newList.push(...dicom_list)
  })
  return newList
}

const pushDicomToFiles = (dicom: Dicom, series: SeriesData) => {
  const file = {
    image_id: dicom.image_id,
    thumbnail: dicom.thumbnail,
    file: dicom.image_url,
    fileName: '',
    tagInfo: null,
    dicomInfo: null,
    measureTools: [],
    note: '',
    PatientName: series.patient_name.Alphabetic.Given[0],
    PatientAge: series.patient_age,
    PatientSex: series.patient_sex,
    SeriesDescription: series.series_description,
    instanceNumber: dicom.instance_number,
    seriesNumber: series.series_number,
  }
}

export const composeFilesList = (tempSeriesData: SeriesData[]) => {
  tempSeriesData.forEach((series: SeriesData) => {
    series.dicom_list.forEach((dicom: Dicom) => {
      pushDicomToFiles(dicom, series) // files second dimension array for dicoms
    })
  })
}
