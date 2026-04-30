import React from 'react';
import './Footer.css';
import { assets } from '../../assets/assets';

const Footer = () => {
  return (
    <footer className='footer' id='footer'>
      <div className="footer-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-brand-head">
              <img src={assets.logo} alt="Pizza Boy" className="footer-logo" />
              <div>
                <h2>Pizza Boy</h2>
                <p>Wood Fired Bistro</p>
              </div>
            </div>
            <p className="footer-description">
              Fresh comfort food, wood-fired favorites, and quick delivery designed to make every order simple and satisfying.
            </p>
            <div className="footer-social">
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <img src={assets.linkedin_icon} alt="" className="social-icon" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <img src={assets.twitter_icon} alt="" className="social-icon" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <img src={assets.facebook_icon} alt="" className="social-icon" />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3>Company</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="#explore-menu">Menu</a></li>
              <li><a href="/cart">Delivery</a></li>
              <li><a href="#footer">About Us</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3>Support</h3>
            <ul>
              <li><a href="/myorders">Track Order</a></li>
              <li><a href="#app-download">Mobile App</a></li>
              <li><a href="#footer">Help & Support</a></li>
              <li><a href="#footer">Terms & Conditions</a></li>
            </ul>
          </div>

          <div className="footer-column footer-contact">
            <h3>Contact</h3>
            <ul>
              <li><a href="tel:+919951221593">+91-9951221593</a></li>
              <li><a href="mailto:contact@pizzaboy.com">contact@pizzaboy.com</a></li>
              <li>Velachery, Chennai</li>
            </ul>
            <form className="newsletter-form">
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
          </div>
        </div>

        <div className="footer-map">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.855781245435!2d80.23510207442796!3d12.981074614671803!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a525dc229346d87%3A0xcffc7ee98a56b747!2sPizzaBoy%20-%20Wood%20Fired%20Bistro%20Velachery!5e0!3m2!1sen!2sin!4v1722788999930!5m2!1sen!2sin"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Location"
          />
        </div>

        <div className="footer-bottom">
          <p>Copyright 2024 © Created by Thivakar</p>
          <div className="footer-bottom-links">
            <a href="#footer">Privacy Policy</a>
            <a href="#footer">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
