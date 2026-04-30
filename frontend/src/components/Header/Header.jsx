import React from 'react'
import './Header.css'

const Header = () => {
    return (
        <section className='header'>
            <video
                className='header-video'
                autoPlay
                loop
                muted
                playsInline
            >
                <source src='/hero-video.mp4' type='video/mp4' />
            </video>
            <div className='header-overlay'></div>
            <div className='header-contents'>
                <span className='header-eyebrow'>Fresh from the oven</span>
                <h2>Crave-worthy pizza, salads, and comfort food for every mood</h2>
                <p>From cheesy slices to crisp bowls and dessert treats, Pizza Boy brings a colorful spread that feels fast, fresh, and satisfying.</p>
                <div className="header-actions">
                    <a href="#explore-menu" className='header-primary'>Explore menu</a>
                    <a href="#food-display" className='header-secondary'>Top picks</a>
                </div>
            </div>
        </section>
    )
}

export default Header
