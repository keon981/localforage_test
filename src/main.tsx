import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App'
// import LocalForageApp from './LocalForageApp'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <LocalForageApp /> */}
    <App />
  </React.StrictMode>,
)
