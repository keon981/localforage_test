import { useRef, useState } from 'react'
import './App.css'
import localforage from 'localforage'
// import { Stores, addData, initDB } from './db'

interface UserDataType {
  id: string | number,
  name: string
  email: string
}

const myIndexedDB = localforage.createInstance({
  name: 'newDB',
})

function App() {
  const [userData, setUserData] = useState<UserDataType[]>([])
  const [isDBReady, setIsDBReady] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const getData = async () => {
    const arr:UserDataType[] = []
    try {
      await myIndexedDB.iterate((value) => {
        arr.push(value as UserDataType)
      })
    } catch (err) {
      console.error('getData error', err)
    } finally {
      console.log('finally')
      console.log(formRef)
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

  const addNewData = async (newValue:UserDataType) => {
    try {
      await myIndexedDB.setItem(`${newValue.id}`, newValue)
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
        await addNewData({
          name: name.value,
          email: email.value,
          id: Date.now(),
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

  const handleDelete = async () => {
    myIndexedDB.clear((err) => {
      if (err) {
        console.log(err)
      } else {
        alert('Delete finish')
      }
    })
  }

  // useEffect(() => {

  //   // return () => {
  //   //   handleDelete()
  //   // }
  // }, [formRef])

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

export default App
