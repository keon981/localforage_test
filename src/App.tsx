/* eslint-disable max-len */
import { useState } from 'react'
// import WebWokerPage from './pages/WebWokerPage'
// import CornerstoneElement from './pages/CornerStoneApp'
import WorkerIDBApp from './pages/WorkerIDBApp'
// import { smallBase64 } from './assets/base64/small'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { wadoDcm } from './assets/base64/wado_dcm'

const dicomuri = 'https://dev.label.efai.tw/api/viewer/image/wado?RequestType=wado&studyUID=1.2.124.113532.10.10.5.8.20140913.102134.12479216&seriesUID=1.3.51.5146.3025.20140913.1095236&objectUID=1.3.51.0.7.626745169.14964.4580.34417.15.8072.4088'
const photo = 'https://dev.label.efai.tw/api/viewer/image/rs/studies/1.2.124.113532.10.10.5.8.20140913.102134.12479216/series/1.3.51.5146.3025.20140913.1095236/thumbnail'
// const imageUrl = 'https://segmentfault.com/img/remote/1460000041800574'
// const imageId = 'https://dev.label.efai.tw/api/viewer/image/wado?RequestType=wado&studyUID=611.132629441.853.937625735.3.893.2.916311.48.2.1&seriesUID=811.132629441.853.937625735.3.893.2.916311.48.2.1&objectUID=1.21.132629441.853.937625735.3.893.2.916311.48.2.1'
// eslint-disable-next-line @typescript-eslint/no-unused-vars

function App() {
  const [isDicomUrl, setIsDicomUrl] = useState(false)
  const imageIds = isDicomUrl ? [photo] : [`wadouri:${dicomuri}`]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stack = {
    imageIds,
    currentImageIdIndex: 0,
  }

  const handleChange = () => setIsDicomUrl(!isDicomUrl)

  return (
    <>
      {/* <img src={`data:image/png;base64, ${wadoDcm}`}
       alt="" style={{ height: '1000px', width: '1000px' }} /> */}
      {/* <div style={{
        marginBottom: '1rem',
        textAlign: 'center',
      }}
      >
        <button type="button" onClick={handleChange}>change</button>
      </div> */}
      {/* <div className="ani" /> */}
      {/* <CornerstoneElement stack={stack} /> */}
      {/* <ImageToBase64 imageURL={dicomuri} /> */}
      {/* <WebWokerPage /> */}

    </>
  )
}

export default App
