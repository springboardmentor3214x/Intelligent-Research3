import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { BrowserRouter, Route, Routes } from "react-router-dom";

function App() {

    return (
        <BrowserRouter>
            <Routes>

                      <Route path="/register" element={<Register />}></Route>
                <Route path="/login" element={<Login />}></Route>
          
            </Routes>


        </BrowserRouter>                                                                              
       
   
   
    );
}

export default App;