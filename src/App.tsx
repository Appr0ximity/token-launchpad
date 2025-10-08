import './App.css'
import { InputField } from './components/InputField'

function App() {

  return <div className='w-screen h-screen bg-black mx-auto flex flex-col justify-center items-center'>
    <InputField placeholder='Name of Token'></InputField>
    <InputField placeholder='Symbol'></InputField>
    <InputField placeholder='Initial Supply'></InputField>
    <InputField placeholder='Image URL'></InputField>
    <button className='bg-gray-400 rounded-sm px-3 py-1 my-3 cursor-pointer hover:bg-gray-800 duration-200 hover:text-white'>Submit</button>
  </div>
}

export default App
