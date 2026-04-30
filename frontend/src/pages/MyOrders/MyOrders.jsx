import { useContext, useEffect, useMemo, useState } from 'react';
import './MyOrders.css';
import axios from 'axios';
import { StoreContext } from '../../Context/StoreContext';
import { assets } from '../../assets/assets';
import { io } from 'socket.io-client';
import { jsPDF } from 'jspdf';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const orderStatusFlow = ["Placed", "Preparing", "Assigned", "On the Way", "Delivered"];

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDate = (value) => new Date(value).toLocaleString();
const formatShortDate = (value) => new Date(value).toLocaleDateString("en-GB");
const formatTimelineDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const getAssignedPartnerName = (order) => {
  if (typeof order.assignedDeliveryPartner === "string") {
    return order.status === "Assigned" || order.status === "On the Way" || order.status === "Delivered"
      ? "Rider assigned"
      : "Pending assignment";
  }

  return order.assignedDeliveryPartner?.name ||
    (order.status === "Assigned" || order.status === "On the Way" || order.status === "Delivered"
      ? "Rider assigned"
      : "Pending assignment");
};

const getAssignedPartnerVehicle = (order) =>
  typeof order.assignedDeliveryPartner === "object"
    ? order.assignedDeliveryPartner?.vehicleNumber || "Vehicle details pending"
    : "Vehicle details pending";

const getAssignedPartnerPhone = (order) =>
  typeof order.assignedDeliveryPartner === "object"
    ? order.assignedDeliveryPartner?.phone || "Phone unavailable"
    : "Phone unavailable";

const createEmojiIcon = (emoji, className) =>
  L.divIcon({
    className: `tracking-marker ${className}`,
    html: `<span>${emoji}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -18],
  });

const restaurantIcon = createEmojiIcon('\uD83C\uDF55', 'restaurant');
const customerIcon = createEmojiIcon('\uD83C\uDFE0', 'customer');
const riderIcon = createEmojiIcon('\uD83D\uDEF5', 'rider');

const FitTrackingBounds = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length < 2) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, points]);

  return null;
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const { url, token } = useContext(StoreContext);
  const socket = useMemo(() => io(url, { transports: ["websocket", "polling"] }), [url]);

  const fetchOrders = async () => {
    const response = await axios.post(url + "/api/order/userorders", {}, { headers: { token } });
    if (response.data.success) {
      setOrders(response.data.data);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchOrders();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    if (!orders.length) return;

    orders.forEach((order) => socket.emit("order:join", order._id));

    return () => {
      orders.forEach((order) => socket.emit("order:leave", order._id));
    };
  }, [orders, socket]);

  useEffect(() => {
    const handleOrderUpdate = (updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order))
      );
    };

    socket.on("order:updated", handleOrderUpdate);

    return () => {
      socket.off("order:updated", handleOrderUpdate);
      socket.close();
    };
  }, [socket]);

  const toggleTrackingDetails = (orderId) => {
    setActiveOrderId((prevOrderId) => (prevOrderId === orderId ? null : orderId));
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(`${url}/api/order/invoice/${orderId}`, {
        headers: { token },
      });

      if (!response.data.success) {
        return;
      }

      const invoice = response.data.data;
      const pdf = new jsPDF();
      const customerName = [invoice.address.firstName, invoice.address.lastName].filter(Boolean).join(" ");
      const addressLine = [
        invoice.address.street,
        invoice.address.zipcode,
        invoice.address.formattedAddress,
      ].filter(Boolean).join(", ");
      const subtotal = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryCharge = Math.max(invoice.amount - subtotal, 0);

      pdf.setDrawColor(180, 180, 180);
      pdf.setLineDashPattern([1.2, 1.2], 0);
      pdf.rect(8, 8, 194, 280);
      pdf.setLineDashPattern([], 0);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.text("Pizza Boy - Wood Fired Bistro", 105, 24, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Annai Velankanni Nagar,", 105, 34, { align: "center" });
      pdf.text("Mugalivakkam, Chennai - 600125", 105, 41, { align: "center" });
      pdf.text("Phone: 081110 00177", 105, 48, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text(`Order ID: ${invoice.trackingNumber}`, 105, 62, { align: "center" });
      pdf.setFontSize(13);
      pdf.text(`Date: ${formatShortDate(invoice.date)}`, 105, 72, { align: "center" });

      pdf.setDrawColor(205, 205, 205);
      pdf.line(18, 82, 192, 82);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Invoice: ${invoice.invoiceNumber}`, 18, 92);
      pdf.text(`Customer: ${customerName || "Customer"}`, 18, 100);
      pdf.text(`Phone: ${invoice.address.phone || "-"}`, 18, 108);
      pdf.text(`Address: ${addressLine || "-"}`, 18, 116, { maxWidth: 168 });

      let y = 132;
      pdf.setDrawColor(215, 215, 215);
      pdf.line(18, y, 192, y);
      y += 10;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Item", 20, y);
      pdf.text("Qty", 110, y, { align: "center" });
      pdf.text("Price", 140, y, { align: "center" });
      pdf.text("Total", 182, y, { align: "right" });
      y += 6;
      pdf.line(18, y, 192, y);
      y += 8;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");

      invoice.items.forEach((item) => {
        const itemTotal = item.price * item.quantity;
        pdf.text(item.name, 20, y, { maxWidth: 82 });
        pdf.text(String(item.quantity), 110, y, { align: "center" });
        pdf.text(String(item.price), 140, y, { align: "center" });
        pdf.text(String(itemTotal), 182, y, { align: "right" });
        y += 11;
      });

      if (deliveryCharge > 0) {
        pdf.text("Delivery Charge", 20, y);
        pdf.text("1", 110, y, { align: "center" });
        pdf.text(String(deliveryCharge), 140, y, { align: "center" });
        pdf.text(String(deliveryCharge), 182, y, { align: "right" });
        y += 11;
      }

      pdf.line(18, y, 192, y);
      y += 14;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(17);
      pdf.text("Grand Total", 20, y);
      pdf.text(`Rs${invoice.amount}`, 182, y, { align: "right" });
      y += 16;

      pdf.line(18, y, 192, y);
      y += 16;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text("Thanks for your order!", 105, y, { align: "center" });
      pdf.text("Need help? contact@pizzaboy.com", 105, y + 8, { align: "center" });
      pdf.text("See you again soon! Pizza", 105, y + 16, { align: "center" });

      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (error) {
      console.error("Invoice generation failed", error);
    }
  };

  const activeOrdersCount = orders.filter((order) => order.status !== "Delivered").length;

  return (
    <div className='my-orders'>
      <div className="my-orders-hero">
        <div className="my-orders-copy">
          <span className="my-orders-eyebrow">Order center</span>
          <h2>My Orders</h2>
          <p className="my-orders-subtitle">
            Track your delivery in real time, follow every order stage, and download a polished invoice after delivery.
          </p>
        </div>
        <div className="orders-summary">
          <div className="summary-pill">
            <span>Total orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="summary-pill">
            <span>Active now</span>
            <strong>{activeOrdersCount}</strong>
          </div>
        </div>
      </div>

      <div className="container">
        {orders.length === 0 && (
          <div className="empty-orders">
            <h3>No orders yet</h3>
            <p>Your placed orders will appear here once you complete checkout.</p>
          </div>
        )}

        {orders.map((order, index) => {
          const isActive = activeOrderId === order._id;
          const isDelivered = order.status === "Delivered";
          const customerLocation = order.address?.location;
          const shopLocation = order.restaurantLocation || { lat: 11.017, lng: 76.989 };
          const riderLocation = order.deliveryTracking?.currentLocation;
          const statusTimeline = Array.isArray(order.statusTimeline) && order.statusTimeline.length > 0
            ? order.statusTimeline
            : [
                {
                  status: order.status || "Placed",
                  note: "Order received",
                  changedAt: order.date || new Date().toISOString(),
                },
              ];
          const canShowMap =
            Boolean(customerLocation?.lat && customerLocation?.lng) &&
            Boolean(shopLocation?.lat && shopLocation?.lng);
          const routePath = canShowMap
            ? [
                { lat: shopLocation.lat, lng: shopLocation.lng },
                { lat: customerLocation.lat, lng: customerLocation.lng },
              ]
            : [];
          const mapPoints = riderLocation?.lat && riderLocation?.lng
            ? [...routePath, { lat: riderLocation.lat, lng: riderLocation.lng }]
            : routePath;
          const distance = canShowMap
            ? calculateDistance(customerLocation.lat, customerLocation.lng, shopLocation.lat, shopLocation.lng)
            : 0;
          const currentStepIndex = Math.max(orderStatusFlow.indexOf(order.status), 0);
          const shouldShowMap = !isDelivered && canShowMap;
          const timelineByStatus = orderStatusFlow.map((status, statusIndex) => {
            const matchedEntry = [...statusTimeline].reverse().find(
              (timelineItem) => timelineItem.status === status
            );

            return {
              status,
              isDone: statusIndex <= currentStepIndex,
              note:
                matchedEntry?.note ||
                (statusIndex <= currentStepIndex ? "Status updated" : "Waiting for update"),
              changedAt: matchedEntry?.changedAt || null,
            };
          });

          return (
            <div key={order._id || index} className={`order-card ${isActive ? 'active' : ''}`}>
              <div className="order-top">
                <div className="order-header">
                  <div className="parcel-badge">
                    <img src={assets.parcel_icon} alt="Parcel" className="parcel-icon" />
                  </div>
                  <div className="order-info">
                    <div className="order-meta">
                      <span className="order-meta-chip">Status: {order.status}</span>
                      <span className="order-meta-chip">Tracking: {order.trackingNumber}</span>
                      <span className="order-meta-chip">Invoice: {order.invoiceNumber}</span>
                    </div>
                    <p className="order-items">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="order-item">
                          <b>{item.name}</b>
                          <span className="quantity">x {item.quantity}</span>
                        </span>
                      ))}
                    </p>
                  </div>
                </div>

                <div className="order-side">
                  <div className="order-stat-grid">
                    <div className="order-stat-card">
                      <span>Order date</span>
                      <strong>{new Date(order.date).toLocaleDateString()}</strong>
                    </div>
                    <div className="order-stat-card">
                      <span>Total amount</span>
                      <strong>Rs. {order.amount}.00</strong>
                    </div>
                  </div>
                  <div className="order-actions">
                    <button
                      onClick={() => toggleTrackingDetails(order._id)}
                      className="track-button"
                      disabled={isDelivered}
                    >
                      {isDelivered ? 'Delivered' : isActive ? 'Hide Details' : 'Track Order'}
                    </button>
                    <button
                      onClick={() => downloadInvoice(order._id)}
                      className="invoice-button"
                      disabled={order.status !== "Delivered"}
                    >
                      Download Invoice
                    </button>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="tracking-details">
                  <div className="status-line-card">
                    <p className="status-line-title">Order Status</p>
                    <div className="status-line">
                      {timelineByStatus.map((timelineItem) => (
                        <div
                          key={timelineItem.status}
                          className={`status-line-item ${timelineItem.isDone ? "done" : ""}`}
                        >
                          <div className="status-line-marker" aria-hidden="true">
                            <span className="status-line-dot" />
                          </div>
                          <div className="status-line-content">
                            <div className="status-line-heading">
                              <strong>{timelineItem.status}</strong>
                              {timelineItem.changedAt && (
                                <span>{formatTimelineDate(timelineItem.changedAt)}</span>
                              )}
                            </div>
                            <p>{timelineItem.note}</p>
                            {timelineItem.changedAt && (
                              <small>{formatDate(timelineItem.changedAt)}</small>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="delivery-info rider-details-grid">
                    <div className="info-card">
                      <h4>Delivery rider</h4>
                      <p>{getAssignedPartnerName(order)}</p>
                    </div>
                    <div className="info-card">
                      <h4>Vehicle number</h4>
                      <p>{getAssignedPartnerVehicle(order)}</p>
                    </div>
                    <div className="info-card">
                      <h4>Phone</h4>
                      <p>{getAssignedPartnerPhone(order)}</p>
                    </div>
                    <div className="info-card">
                      <h4>Invoice status</h4>
                      <p>{isDelivered ? "Ready to download" : "Available after delivery"}</p>
                    </div>
                  </div>

                  {shouldShowMap ? (
                    <div className="tracking-step tracking-map-card">
                      <p><b>Live delivery tracking</b></p>
                      <div className="map-container">
                        <MapContainer
                          center={[shopLocation.lat, shopLocation.lng]}
                          zoom={12}
                          style={{ height: '340px', width: '100%' }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; OpenStreetMap contributors'
                          />
                          <FitTrackingBounds points={mapPoints} />
                          <Marker position={[shopLocation.lat, shopLocation.lng]} icon={restaurantIcon}>
                            <Popup>Restaurant location</Popup>
                          </Marker>
                          <Marker position={[customerLocation.lat, customerLocation.lng]} icon={customerIcon}>
                            <Popup>Customer address</Popup>
                          </Marker>
                          {riderLocation?.lat && riderLocation?.lng && (
                            <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
                              <Popup>{getAssignedPartnerName(order)}</Popup>
                            </Marker>
                          )}
                          <Polyline
                            positions={routePath.map((point) => [point.lat, point.lng])}
                            color="#2563eb"
                            weight={4}
                            opacity={0.85}
                          />
                        </MapContainer>
                      </div>

                      <div className="delivery-info">
                        <div className="info-card">
                          <h4>Distance</h4>
                          <p>{distance.toFixed(2)} km</p>
                        </div>
                        <div className="info-card">
                          <h4>Estimated time</h4>
                          <p>{order.deliveryTracking?.estimatedDurationMinutes || 18} min</p>
                        </div>
                      </div>
                    </div>
                  ) : isDelivered ? (
                    <div className="tracking-map-empty">
                      <p><b>Delivery completed.</b></p>
                      <p>Live tracking is closed after delivery. Your invoice is ready to download.</p>
                    </div>
                  ) : (
                    <div className="tracking-map-empty">
                      <p><b>Customer location unavailable.</b></p>
                      <p>Add an exact address while placing the order to enable live map tracking.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
