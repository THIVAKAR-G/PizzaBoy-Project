import './Navbar.css'
import { assets } from '../../assets/assets'

const Navbar = () => {
  return (
    <div className='navbar'>
      <div className="navbar-brand">
        <img className='logo' src={assets.logo} alt="Pizza Boy admin" />
        <div className="navbar-brand-copy">
          <span className="navbar-label">Admin dashboard</span>
          <h1>Kitchen control center</h1>
        </div>
      </div>
      <div className="navbar-profile">
        <div className="navbar-status">
          <span>Live</span>
          <strong>Store online</strong>
        </div>
        <img className='profile' src={assets.profile_image} alt="Admin profile" />
      </div>
    </div>
  )
}

export default Navbar
