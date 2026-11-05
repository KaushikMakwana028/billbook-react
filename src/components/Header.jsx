import { Link } from 'react-router-dom'

const Header = () => {
  return (
    <header className="bg-indigo-600 p-4 text-white">
      <Link to="/" className="font-bold">Header</Link>
    </header>
  )
}

export default Header