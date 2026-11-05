import { Routes, Route } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import Home from '../pages/Home'

const AppRoutes = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<h1 className="text-2xl font-bold">404 - Page Not Found</h1>} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default AppRoutes