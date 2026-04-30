import { useEffect, useState } from 'react'
import './List.css'
import { url } from '../../assets/assets'
import axios from 'axios';
import { toast } from 'react-toastify';

const List = () => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Failed to load food list");
      }
    } catch (error) {
      toast.error("Unable to fetch food list");
    }
  };

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, {
        id: foodId
      });
      await fetchList();
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error("Failed to remove food");
      }
    } catch (error) {
      toast.error("Unable to remove food");
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className='list admin-page'>
      <div className="admin-page-header">
        <span className="admin-page-eyebrow">Menu library</span>
        <h2>List dishes</h2>
        <p>Review every published item, scan pricing quickly, and remove dishes that should no longer appear in the menu.</p>
      </div>
      <div className='list-shell'>
        <div className='list-table'>
          <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Action</b>
          </div>
          {list.map((item, index) => {
            return (
              <div key={item._id || index} className='list-table-format'>
                <img src={`${url}/images/` + item.image} alt={item.name} />
                <p>{item.name}</p>
                <p>{item.category}</p>
                <p>Rs. {item.price}</p>
                <p className='cursor list-delete' onClick={() => removeFood(item._id)}>Delete</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default List
