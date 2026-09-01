import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tagging from './pages/Tagging'
import Review from './pages/Review'
import Search from './pages/Search'
import Personas from './pages/Personas'
import Metrics from './pages/Metrics'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  return (
    <Router>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
          <div className="p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tagging" element={<Tagging />} />
              <Route path="/review" element={<Review />} />
              <Route path="/search" element={<Search />} />
              <Route path="/personas" element={<Personas />} />
              <Route path="/metrics" element={<Metrics />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  )
}

export default App
