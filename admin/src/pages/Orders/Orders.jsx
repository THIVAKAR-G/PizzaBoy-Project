import { useEffect, useMemo, useState } from 'react'
import './Orders.css'
import { toast } from 'react-toastify';
import axios from 'axios';
import { io } from 'socket.io-client';
import { assets, url } from '../../assets/assets';

const statusOptions = ["Placed", "Preparing", "Assigned", "On the Way", "Delivered"];

const interpolatePoint = (start, end, progress = 0.18) => ({
  lat: start.lat + (end.lat - start.lat) * progress,
  lng: start.lng + (end.lng - start.lng) * progress,
});

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const socket = useMemo(() => io(url, { transports: ["websocket", "polling"] }), []);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/order/list`);

      if (response.data.success) {
        setOrders(response.data.data.reverse());
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      toast.error("Unable to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPartners = async () => {
    try {
      const response = await axios.get(`${url}/api/delivery-partner/list`);
      if (response.data.success) {
        setDeliveryPartners(response.data.data);
      }
    } catch (error) {
      toast.error("Unable to load delivery partners");
    }
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(`${url}/api/order/status`, {
        orderId,
        status: event.target.value
      });

      if (response.data.success) {
        toast.success("Order status updated");
        await fetchAllOrders();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      toast.error("Unable to update order status");
    }
  };

  const assignDeliveryPartner = async (orderId, deliveryPartnerId) => {
    if (!deliveryPartnerId) return;

    try {
      const response = await axios.post(`${url}/api/order/assign`, {
        orderId,
        deliveryPartnerId,
      });

      if (response.data.success) {
        toast.success("Delivery partner assigned");
        await fetchAllOrders();
        await fetchDeliveryPartners();
      } else {
        toast.error("Unable to assign delivery partner");
      }
    } catch (error) {
      toast.error("Unable to assign delivery partner");
    }
  };

  const toggleTracking = async (orderId, enabled) => {
    try {
      const response = await axios.post(`${url}/api/order/tracking/toggle`, {
        orderId,
        enabled,
      });

      if (response.data.success) {
        toast.success(enabled ? "Tracking started" : "Tracking stopped");
        await fetchAllOrders();
      } else {
        toast.error("Unable to change tracking state");
      }
    } catch (error) {
      toast.error("Unable to change tracking state");
    }
  };

  const moveRider = async (order) => {
    const destination = order.address?.location;
    const current = order.deliveryTracking?.currentLocation || order.restaurantLocation;

    if (!destination?.lat || !destination?.lng || !current?.lat || !current?.lng) {
      toast.error("Customer location is missing");
      return;
    }

    const nextPoint = interpolatePoint(current, destination);

    try {
      const response = await axios.post(`${url}/api/order/tracking/location`, {
        orderId: order._id,
        lat: nextPoint.lat,
        lng: nextPoint.lng,
      });

      if (response.data.success) {
        toast.success("Delivery rider moved");
        await fetchAllOrders();
      } else {
        toast.error("Unable to update rider location");
      }
    } catch (error) {
      toast.error("Unable to update rider location");
    }
  };

  const getCustomerName = (address = {}) => {
    const fullName = [address.firstName, address.lastName].filter(Boolean).join(" ").trim();
    return fullName || "Customer";
  };

  const getAddressLine = (address = {}) => {
    const parts = [
      address.street,
      address.zipcode,
      address.formattedAddress,
    ].filter(Boolean);

    return parts.length ? parts.join(", ") : "Address not available";
  };

  useEffect(() => {
    fetchAllOrders();
    fetchDeliveryPartners();
  }, []);

  useEffect(() => {
    socket.on("admin:orders-updated", fetchAllOrders);
    return () => {
      socket.off("admin:orders-updated", fetchAllOrders);
      socket.close();
    };
  }, [socket]);

  return (
    <div className='order admin-page'>
      <div className="admin-page-header">
        <span className="admin-page-eyebrow">Operations</span>
        <h2>Order management</h2>
        <p>Assign delivery riders, move orders through the kitchen workflow, and control live tracking from one modern dashboard.</p>
      </div>
      <div className="order-shell">
        {loading && <p className='order-loading'>Loading orders...</p>}
        <div className="order-list">
          {orders.map((order, index) => (
            <div key={order._id || index} className='order-item'>
              <img src={assets.parcel_icon} alt="Parcel" />

              <div className="order-main">
                <div className="order-main-top">
                  <span className="order-chip">{order.trackingNumber || order._id?.slice(-6)}</span>
                  <span className={`order-chip status-${order.status?.toLowerCase().replace(/\s+/g, "-")}`}>{order.status}</span>
                </div>

                <p className='order-item-food'>
                  {order.items.map((item, itemIndex) => {
                    const text = `${item.name} x ${item.quantity}`;
                    return itemIndex === order.items.length - 1 ? text : `${text}, `;
                  })}
                </p>

                <p className='order-item-name'>{getCustomerName(order.address)}</p>
                <div className='order-item-address'>
                  <p>{getAddressLine(order.address)}</p>
                </div>
                <p className='order-item-phone'>{order.address?.phone || "Phone not available"}</p>
              </div>

              <div className="order-side-meta">
                <div className="order-badge">Items: {order.items.length}</div>
                <div className="order-badge">Payment: {order.payment ? "Paid" : order.paymentMethod}</div>
                <div className="order-badge">Invoice: {order.invoiceNumber}</div>
                <div className="order-total">Rs. {order.amount}</div>
              </div>

              <div className="order-controls">
                <label className="order-field">
                  <span>Status</span>
                  <select onChange={(e) => statusHandler(e, order._id)} value={order.status}>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className="order-field">
                  <span>Delivery boy</span>
                  <select
                    onChange={(e) => assignDeliveryPartner(order._id, e.target.value)}
                    value={order.assignedDeliveryPartner?._id || ""}
                  >
                    <option value="">Select rider</option>
                    {deliveryPartners.map((partner) => (
                      <option key={partner._id} value={partner._id}>
                        {partner.name} {"\u2022"} {partner.status}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="tracking-controls">
                  <button
                    type="button"
                    className="tracking-button secondary"
                    onClick={() => toggleTracking(order._id, !order.trackingEnabled)}
                  >
                    {order.trackingEnabled ? "Stop tracking" : "Start tracking"}
                  </button>
                  <button
                    type="button"
                    className="tracking-button"
                    onClick={() => moveRider(order)}
                    disabled={!order.assignedDeliveryPartner}
                  >
                    Update rider location
                  </button>
                </div>

                <div className="order-assignee-card">
                  <span>Assigned rider</span>
                  <strong>{order.assignedDeliveryPartner?.name || "Not assigned yet"}</strong>
                  <p>
                    {order.assignedDeliveryPartner?.vehicleNumber || "Assign a rider to enable delivery tracking."}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Order
