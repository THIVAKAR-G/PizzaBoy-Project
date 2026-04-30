import React, { useContext, useMemo, useState, useEffect } from 'react';
import './FoodDisplay.css';
import FoodItem from '../FoodItem/FoodItem';
import { StoreContext } from '../../Context/StoreContext';

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredFoodList = useMemo(() => {
    return food_list.filter((item) => category === "All" || category === item.category);
  }, [food_list, category]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category]);

  const totalPages = Math.ceil(filteredFoodList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFoodList = filteredFoodList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <section className='food-display' id='food-display'>
      <div className="food-display-head">
        <div>
          <span className="section-tag">Featured plates</span>
          <h2>{category === "All" ? "Popular picks for today" : `${category} specials`}</h2>
          <p>Handpicked dishes that keep the menu vibrant, balanced, and worth coming back for.</p>
        </div>
        <div className="food-display-meta">
          <span>{filteredFoodList.length} dishes</span>
        </div>
      </div>

      <div className='food-display-list'>
        {paginatedFoodList.map((item) => (
          <FoodItem
            key={item._id}
            image={item.image}
            name={item.name}
            desc={item.description}
            price={item.price}
            id={item._id}
          />
        ))}
      </div>

      {filteredFoodList.length === 0 && (
        <div className="food-empty-state">
          <h3>No dishes found</h3>
          <p>Try another category to explore more items from the menu.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className='pagination-controls'>
          <button
            className='pagination-btn'
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className='pagination-numbers'>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={`pagination-number ${currentPage === index + 1 ? 'active' : ''}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <button
            className='pagination-btn'
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};

export default FoodDisplay;
