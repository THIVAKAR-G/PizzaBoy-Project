import React, { useContext, useEffect, useRef, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom'
import { StoreContext } from '../../Context/StoreContext'

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { getTotalCartAmount, token ,setToken, userName, setUserName } = useContext(StoreContext);
  const navigate = useNavigate();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken("");
    setUserName("");
    setIsProfileOpen(false);
    navigate('/')
  }

  return (
    <div className='navbar'>
      <Link to='/' className='navbar-brand' onClick={() => setMenu("home")}>
        <img className='logo' src={assets.logo} alt="Pizza Boy logo" />
      </Link>
      <ul className="navbar-menu">
        <Link to="/" onClick={() => setMenu("home")} className={`${menu === "home" ? "active" : ""}`}>home</Link>
        <a href='#explore-menu' onClick={() => setMenu("menu")} className={`${menu === "menu" ? "active" : ""}`}>menu</a>
        <a href='#app-download' onClick={() => setMenu("mob-app")} className={`${menu === "mob-app" ? "active" : ""}`}>mobile app</a>
        <a href='#footer' onClick={() => setMenu("contact")} className={`${menu === "contact" ? "active" : ""}`}>contact us</a>
      </ul>
      <div className="navbar-right">
        <div className="navbar-icon-shell">
          <img src={assets.search_icon} alt="Search" />
        </div>
        <Link to='/cart' className='navbar-search-icon'>
          <div className="navbar-icon-shell">
            <img src={assets.basket_icon} alt="Cart" />
          </div>
          <div className={getTotalCartAmount() > 0 ? "dot" : ""}></div>
        </Link>
        {!token ? <button className='navbar-signin' onClick={() => setShowLogin(true)}>sign in</button>
          : <div className='navbar-profile' ref={profileRef}>
            <div className='navbar-user-greeting'>
              <span>Hi</span>
              <strong>{userName || "User"}</strong>
            </div>
            <button
              type="button"
              className='navbar-profile-trigger'
              onClick={() => setIsProfileOpen((open) => !open)}
            >
              <img src={assets.profile_icon} alt="User profile" />
            </button>
            <ul className={`navbar-profile-dropdown ${isProfileOpen ? "open" : ""}`}>
              <li onClick={() => {
                setIsProfileOpen(false);
                navigate('/myorders');
              }}>
                <img src={assets.bag_icon} alt="" />
                <p>My orders</p>
              </li>
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        }
      </div>
    </div>
  )
}

export default Navbar
