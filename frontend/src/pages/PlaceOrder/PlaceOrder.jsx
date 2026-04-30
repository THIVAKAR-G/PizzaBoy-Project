import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { geocodeAddress } from "../../utils/location";

const predefinedSuggestions = [
  "No. 12, Gandhipuram, Coimbatore",
  "No. 45, Peelamedu, Coimbatore",
  "No. 78, RS Puram, Coimbatore",
  "No. 89, Saibaba Colony, Coimbatore",
  "No. 101, Rathinapuri, Coimbatore",
  "No. 56, Singanallur, Coimbatore",
  "No. 34, Saravanampatti, Coimbatore",
  "No. 67, Avinashi Road, Coimbatore",
  "No. 23, Race Course, Coimbatore",
  "No. 34, Hindusthan College, Coimbatore",
  "No. 88, Ganapathy, Coimbatore",
  "No. 91, Thudiyalur, Coimbatore",
  "No. 14, Kovaipudur, Coimbatore",
  "No. 32, Koundampalayam, Coimbatore",
  "No. 7, Ukkadam, Coimbatore",
  "No. 19, Sivanandhapuram, Coimbatore",
  "No. 26, Vadavalli, Coimbatore",
  "No. 42, Vilankurichi, Coimbatore",
  "No. 55, Vellakinar, Coimbatore",
  "No. 73, Sulur, Coimbatore",
  "No. 84, Kuniamuthur, Coimbatore",
  "No. 13, Podanur, Coimbatore",
  "No. 99, Kurichi, Coimbatore",
  "No. 28, Mettupalayam Road, Coimbatore",
  "No. 9, Tidel Park, Coimbatore",
  "No. 66, Sundarapuram, Coimbatore",
  "No. 31, Chinniampalayam, Coimbatore",
  "No. 22, Tiruppur Road, Coimbatore",
  "No. 47, Thondamuthur, Coimbatore",
  "No. 54, Periyanaickenpalayam, Coimbatore",
  "No. 76, Coimbatore North, Coimbatore",
  "No. 85, Coimbatore South, Coimbatore",
  "No. 21, Palakkad Road, Coimbatore",
  "No. 37, Eachanari, Coimbatore",
  "No. 40, Madukkarai, Coimbatore",
  "No. 50, Kavundampalayam, Coimbatore",
  "No. 15, Chinniyampalayam, Coimbatore",
  "No. 68, Peelamedu Pudur, Coimbatore",
];

const predefinedPinCodes = [
  "641001", // R.S. Puram
  "641002", // T.K. Market
  "641003", // Saibaba Mission
  "641004", // Town Hall
  "641005", // Rathinapuri
  "641006", // Tatabad
  "641007", // Pappanaickenpalayam
  "641008", // Siddhapudur
  "641009", // RS Puram South
  "641010", // Peelamedu
  "641011", // Coimbatore Industrial Estate
  "641012", // Ganapathy
  "641013", // Koundampalayam
  "641014", // Kurichi
  "641015", // Ondipudur
  "641016", // Peelamedu East
  "641017", // Saibaba Colony
  "641018", // Selvapuram
  "641019", // Singanallur
  "641020", // Sivananda Colony
  "641021", // Tatabad
  "641022", // Thudiyalur
  "641023", // Ukkadam
  "641024", // Vadavalli
  "641025", // Veerapandi
  "641026", // Vilankurichi
  "641027", // Zamin Uthukuli
  "641028", // Saravanampatti
  "641029", // Sundarapuram
  "641030", // Irugur
  "641031", // Karumathampatti
  "641032", // Karamadai
  "641033", // Kattor
  "641034", // Kovaipudur
  "641035", // Madukkarai
  "641036", // Malumichampatti
  "641037", // Nanjundapuram
  "641038", // Narasimhanaickenpalayam
  "641039", // Peelamedu Pudur
  "641040", // Podanur
  "641041", // Ramnagar
  "641042", // RS Puram North
  "641043", // Saramedu
  "641044", // Sulur
  "641045", // Thottipalayam
  "641046", // Udayampalayam
  "641047", // Vadavalli West
  "641048", // Vellalore
  "641049", // Periyanaickenpalayam
  "641050", // Chinniyampalayam
  "641051", // Eachanari
  "641052", // Ganapathy West
  "641053", // Kinathukadavu
  "641054", // Kinathukadavu East
  "641055", // Mettupalayam Road
  "641056", // MTP Road South
  "641057", // Peelamedu South
  "641058", // Podanur Junction
  "641059", // Sundarapuram East
  "641060", // Tidel Park
  "641061", // Vellakinar
  "641062", // Kuniamuthur
  "641063", // Kurichi South
  "641064", // Kurichi West
  "641065", // Peelamedu Central
  "641066", // Eachanari South
  "641067", // Sundarapuram South
  "641068", // Kovaipudur North
  "641069", // Kovaipudur East
  "641070", // Kovaipudur West
  "641071", // Kovaipudur South,
  // Add more predefined pin codes as needed
];

const PlaceOrder = () => {
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    zipcode: "",
    phone: "",
    paymentMethod: "Online", // Default to Online Payment
    location: null,
    formattedAddress: "",
  });

  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const [pinCodeSuggestions, setPinCodeSuggestions] = useState([]);
  const [showPinCodeSuggestions, setShowPinCodeSuggestions] = useState(false);

  const { getTotalCartAmount, token, food_list, cartItems, url, setCartItems } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      toast.error("Sign in required");
      navigate("/cart");
    } else if (getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token, getTotalCartAmount, navigate]);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData({
      ...data,
      [name]: value,
      ...(name === "street" || name === "zipcode"
        ? { location: null, formattedAddress: "" }
        : {}),
    });

    if (name === "street" && value.length > 2) {
      const filteredSuggestions = predefinedSuggestions.filter((suggestion) =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setStreetSuggestions(filteredSuggestions);
      setShowStreetSuggestions(true);
    } else {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
    }

    if (name === "zipcode" && value.length > 2) {
      const filteredPinCodes = predefinedPinCodes.filter((pinCode) =>
        pinCode.includes(value)
      );
      setPinCodeSuggestions(filteredPinCodes);
      setShowPinCodeSuggestions(true);
    } else {
      setPinCodeSuggestions([]);
      setShowPinCodeSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion, field) => {
    setData({
      ...data,
      [field]: suggestion,
      location: null,
      formattedAddress: "",
    });
    if (field === "street") {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
    } else if (field === "zipcode") {
      setPinCodeSuggestions([]);
      setShowPinCodeSuggestions(false);
    }
  };

  useEffect(() => {
    if (data.street.trim().length < 3 || data.zipcode.trim().length < 5) {
      return undefined;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const resolvedLocation = await geocodeAddress({
          url,
          token,
          address: data,
        });

        if (!resolvedLocation) {
          return;
        }

        setData((prevData) => {
          if (
            prevData.street !== data.street ||
            prevData.zipcode !== data.zipcode
          ) {
            return prevData;
          }

          return {
            ...prevData,
            formattedAddress: resolvedLocation.displayName,
            location: {
              lat: resolvedLocation.lat,
              lng: resolvedLocation.lng,
            },
          };
        });
      } catch (error) {
        console.error("Address geocoding failed:", error);
      }
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [data.street, data.zipcode, token, url]);

  const placeOrder = async (e) => {
    e.preventDefault();
    try {
      if (!data.street.trim() || !data.zipcode.trim()) {
        toast.error("Please enter your street and pin code.");
        return;
      }

      let resolvedLocation = data.location;

      if (!resolvedLocation) {
        const geocodedLocation = await geocodeAddress({
          url,
          token,
          address: data,
        });

        if (!geocodedLocation) {
          toast.error("Please enter a more exact delivery address.");
          return;
        }

        resolvedLocation = {
          lat: geocodedLocation.lat,
          lng: geocodedLocation.lng,
        };
      }

      let orderItems = food_list
        .filter((item) => cartItems[item._id] > 0)
        .map((item) => ({ ...item, quantity: cartItems[item._id] }));

      let orderData = {
        address: {
          ...data,
          street: data.street.trim(),
          zipcode: data.zipcode.trim(),
          formattedAddress: data.formattedAddress || "",
          location: resolvedLocation,
        },
        items: orderItems,
        amount: getTotalCartAmount() + 35, // Including a delivery charge
        paymentMethod: data.paymentMethod,
      };

      let response = await axios.post(url + "/api/order/place", orderData, {
        headers: { token },
      });

      if (response.data.success) {
        if (data.paymentMethod === "Online") {
          window.location.replace(response.data.session_url);
        } else {
          toast.success("Order placed successfully with Cash on Delivery");
          setCartItems({}); // Clear the cart
          navigate("/myorders");
        }
      } else {
        toast.error("Error placing order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("An unexpected error occurred while placing the order.");
    }
  };

  return (
    <form onSubmit={placeOrder} className="place-order" action="https://api.web3forms.com/submit" method="POST">
      <div className="place-order-left">
        <div className="place-order-heading">
          <span className="eyebrow">Checkout</span>
          <p className="title">Delivery Information</p>
          <p className="place-order-subtitle">Add your address and choose how you want to pay.</p>
        </div>

        <input type="hidden" name="access_key" value="727502e3-55bb-4489-a0f3-123dd021127d"/>

        <div className="place-order-section">
          <p className="place-order-section-title">Contact details</p>
          <div className="multi-field">
            <input
              type="text"
              name="firstName"
              onChange={onChangeHandler}
              value={data.firstName}
              placeholder="First name"
              required
            />
            <input
              type="text"
              name="lastName"
              onChange={onChangeHandler}
              value={data.lastName}
              placeholder="Last name"
              required
            />
          </div>
        </div>

        <div className="place-order-section field-stack">
          <p className="place-order-section-title">Delivery address</p>
          <div className="field-with-suggestions">
            <input
              type="text"
              name="street"
              onChange={onChangeHandler}
              value={data.street}
              placeholder="Street, area or landmark"
              required
            />
            {showStreetSuggestions && (
              <ul className="suggestions-list">
                {streetSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion, "street")}
                    className="suggestion-item"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="field-with-suggestions">
            <input
              type="text"
              name="zipcode"
              onChange={onChangeHandler}
              value={data.zipcode}
              placeholder="Pin code"
              required
            />
            {showPinCodeSuggestions && (
              <ul className="suggestions-list">
                {pinCodeSuggestions.map((pinCode, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(pinCode, "zipcode")}
                    className="suggestion-item"
                  >
                    {pinCode}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input
            type="text"
            name="phone"
            onChange={onChangeHandler}
            value={data.phone}
            placeholder="Phone number"
            required
          />
        </div>

        <div className="place-order-section">
          <p className="place-order-section-title">Payment method</p>
          <div className="radio-group">
            <div className="inp">
              <input
                type="radio"
                name="paymentMethod"
                value="Online"
                onChange={onChangeHandler}
                checked={data.paymentMethod === "Online"}
              />
              <label htmlFor="paymentMethod">Online Payment</label>
            </div>
            <div className="inp">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                onChange={onChangeHandler}
                checked={data.paymentMethod === "COD"}
              />
              <label htmlFor="paymentMethod">Cash on Delivery</label>
            </div>
          </div>
        </div>

        <div className="place-order-footer">
          <p className="delivery-note">Estimated delivery in 30 to 45 minutes.</p>
          <button type="submit" className="place-order-submit">
            Place Order
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
