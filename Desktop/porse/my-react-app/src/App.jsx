import { BrowserRouter , Routes, Route} from "react-router-dom"
import Cam from './component/cam'
import Dashboard from './component/dashboard'


function App() {

    return (
< BrowserRouter>
   <Routes>
  <Route path = "/" element = {<Cam/>}  /> 
   <Route path = "/dashboard" element = {<Dashboard/>}/> 
  </Routes>
     </BrowserRouter>
  )
 

}

export default App
