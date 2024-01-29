/* eslint-disable no-console */
import { useEffect, useRef, useState } from 'react'
import './App.css'
import localforage from 'localforage'

// import { Stores, addData, initDB } from './db'

interface UserDataType {
  id: string,
  name: string
  email: string
}
interface SeriesList {
  db:string
  data:UserDataType[]
}

const dBList: LocalForage[] = []

const setValueList = (id:string):UserDataType[] => {
  const list = []
  for (let index = 0; index < 20; index++) {
    list.push({
      id: `${index}`,
      name: `${index}`,
      email: `${id}@mail.com`,
    })
  }
  return list
}

const seriesList = ():SeriesList[] => {
  const list:SeriesList[] = []
  for (let index = 0; index < 9; index++) {
    const newDB = localforage.createInstance({
      storeName: `${Date.now() + index}`,
    })
    dBList.push(newDB)
    list.push({
      db: `${Date.now() + index}`,
      data: setValueList(`${Date.now() + index}`),
    })
  }
  return list
}

function LocalForageApp() {
  const [userData, setUserData] = useState<UserDataType[]>([])
  const [isDBReady, setIsDBReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const createNewDataList = async () => {
    const newWorkList = seriesList()
    let arr:UserDataType[] = []
    newWorkList.map(async ({ data }, index) => {
      arr = data

      data.map(async (item) => {
        await dBList[index].setItem(item.id, item)
      })
    })
    return arr
  }

  const getData = async () => {
    let arr:UserDataType[] = []
    try {
      if (dBList.length) {
        await dBList[0].iterate((value) => {
          arr.push(value as UserDataType)
        })
      } else {
        arr = await createNewDataList()
      }
    } catch (err) {
      console.error('getData error', err)
    } finally {
      setUserData(arr)
    }
  }

  const initDB = async () => {
    try {
      await getData()
    } catch (err) {
      console.error(err)
    }
    setIsDBReady(true)
  }

  const addNewDataItem = async (newValue:UserDataType) => {
    try {
      await dBList[0].setItem(`${newValue.id}`, newValue)
    } catch (err:unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Unknown Error')
      }
    } finally {
      getData()
    }
  }

  const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current

    const target = e.target as typeof e.target & {
      name:{ value:string }
      email:{ value:string }
    }
    const { name, email } = target
    try {
      if (name.value.trim() === '' || email.value.trim() === '') {
        alert('please enter the value')
      } else {
        await addNewDataItem({
          name: name.value,
          email: email.value,
          id: Date.now().toString(),
        })
      }
    } catch (error) {
      console.log(error)
    } finally {
      if (form) {
        form.children[0].value = ''
        form.children[1].value = ''
      }
    }
  }
  console.log('else', dBList.length, dBList)
  const handleDelete = async () => {
    dBList.forEach((item) => {
      console.log('item---', item)

      item.dropInstance()
        .then(() => console.log('success'))
        .catch(() => console.log('error'))
    })
  }

  useEffect(() => {
    // eslint-disable-next-line func-names
    (async function () {
      // const len = await localforage.length()
      // console.log('len', len)

      localforage.iterate((value, key, num) => {
        console.log('localforage---', value, key, num)
      })
    }())

    // return () => {
    //   handleDelete()
    // }
  }, [])

  return (
    <>
      <h1>Index DataBase</h1>
      {!isDBReady ? (
        <button
          type="button"
          onClick={initDB}
        >Init DB
        </button>
      ) : (
        <>
          <h2>DB is ready</h2>
          <button
            type="button"
            onClick={async () => {
              await handleDelete()
              await getData()
            }}
          >delete All
          </button>
          <form onSubmit={handleSubmit} ref={formRef}>
            <input type="text" name="name" id="Name" placeholder="Enter Name" />
            <input type="email" name="email" id="Email" placeholder="Enter Email" />
            <button type="submit">Submit</button>
          </form>
          {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {userData.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  )
}

export default LocalForageApp
