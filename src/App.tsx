import { useState } from 'react'
import CornerstoneElement from './CornerStoneApp'
// import LocalForageApp from './LocalForageApp'

const dicomuri = 'src/assets/wado_1.dcm'
const imageId = 'https://dev.label.efai.tw/api/viewer/image/wado?RequestType=wado&studyUID=611.132629441.853.937625735.3.893.2.916311.48.2.1&seriesUID=811.132629441.853.937625735.3.893.2.916311.48.2.1&objectUID=1.21.132629441.853.937625735.3.893.2.916311.48.2.1'

function App() {
  const [isDicomUri, setIsDicomUri] = useState(true)
  const imageIds = isDicomUri ? [imageId] : [dicomuri]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stack = {
    imageIds,
    currentImageIdIndex: 0,
  }

  const handleChange = () => setIsDicomUri(!isDicomUri)

  return (
    <>
      {/* <LocalForageApp /> */}
      <div style={{
        marginBottom: '1rem',
        textAlign: 'center',
      }}
      >
        <button type="button" onClick={handleChange}>change</button>
      </div>
      <CornerstoneElement stack={stack} />
    </>
  )
}

export default App
