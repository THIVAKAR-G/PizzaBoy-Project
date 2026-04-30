import React, { useContext } from 'react';
import './ExploreMenu.css';
import { StoreContext } from '../../Context/StoreContext';

const ExploreMenu = ({ category, setCategory }) => {
  const { menu_list } = useContext(StoreContext);

  return (
    <section className='explore-menu' id='explore-menu'>
      <div className="explore-menu-head">
        <div>
          <span className="section-tag">Categories</span>
          <h2>Explore Our Menu</h2>
          <p>Move through curated favorites and tap a category to filter the dishes below.</p>
        </div>
        <button
          type="button"
          className={`explore-reset ${category === "All" ? 'active' : ''}`}
          onClick={() => setCategory("All")}
        >
          View all
        </button>
      </div>

      <div className="explore-menu-list">
        {menu_list.length > 0 ? (
          menu_list.map((item, index) => (
            <button
              type="button"
              key={index}
              onClick={() => setCategory(prev => prev === item.menu_name ? "All" : item.menu_name)}
              className={`explore-menu-list-item ${category === item.menu_name ? 'active' : ''}`}
            >
              <div className="explore-thumb-wrap">
                <img src={item.menu_image} alt={item.menu_name} />
              </div>
              <p>{item.menu_name}</p>
            </button>
          ))
        ) : (
          <p>No items available</p>
        )}
      </div>
    </section>
  );
};

export default ExploreMenu;
