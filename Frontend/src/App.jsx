import {Routes, Route} from 'react-router-dom'
import MainPage from "./pages/MainPage/MainPage"
import WelcomePage from "./pages/WelcomePage/WelcomePage"

function App() {

  return (
    <div className="wrapper">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="main" element={<MainPage />} />
      </Routes>
    </div>
  )
}

export default App
