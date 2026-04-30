import React, { useContext, useState } from "react";
import "./Cart.css";
import { StoreContext } from "../../Context/StoreContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const Cart = () => {
  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount } = useContext(StoreContext);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [couponApplied, setCouponApplied] = useState(false);

  const navigate = useNavigate();

  const handleCouponCodeChange = (e) => {
    setCouponCode(e.target.value);
  };

  const applyCouponCode = () => {
    if (couponCode === "THIVA30") {
      setDiscount(getTotalCartAmount() * 0.3);
      setCouponApplied(true);
      toast.success("Coupon applied successfully.", {
        style: { backgroundColor: "green", color: "white" },
      });
    } else if (couponCode === "THIVFIRST") {
      setDeliveryFee(0);
      setCouponApplied(true);
      toast.success("Coupon applied successfully.");
    } else {
      toast.error("Invalid coupon code.");
    }
  };

  const removeCouponCode = () => {
    setDiscount(0);
    setDeliveryFee(50);
    setCouponCode("");
    setCouponApplied(false);
    toast.success("Coupon removed successfully.");
  };

  return (
    <div className="cart">
      <div className="cart-hero">
        <div className="cart-hero-copy">
          <span className="cart-eyebrow">Basket</span>
          <h1>Your Cart</h1>
          <p>Review your items, apply offers, and head to checkout with everything neatly organized.</p>
        </div>
        <div className="cart-hero-stats">
          <div className="cart-stat">
            <span>Items</span>
            <strong>{Object.values(cartItems).reduce((sum, count) => sum + count, 0)}</strong>
          </div>
          <div className="cart-stat">
            <span>Subtotal</span>
            <strong>Rs. {getTotalCartAmount()}</strong>
          </div>
        </div>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          <div className="cart-items-header">
            <h2>Food details</h2>
          </div>
          {food_list.map((item) => {
            if (cartItems[item._id] > 0) {
              return (
                <div key={item._id} className="cart-item">
                  <div className="item-details">
                    <img src={item.image} alt={item.name} className="item-image" />
                    <div className="item-info">
                      <p className="item-title">{item.name}</p>
                      <p className="item-price">Rs. {item.price}</p>
                    </div>
                  </div>

                  <div className="item-actions">
                    <div className="item-quantity-controls">
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => removeFromCart(item._id)}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <img src={assets.remove_icon_red} alt="" />
                      </button>
                      <p className="item-quantity">{cartItems[item._id]}</p>
                      <button
                        type="button"
                        className="quantity-button"
                        onClick={() => addToCart(item._id)}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <img src={assets.add_icon_green} alt="" />
                      </button>
                    </div>

                    <p className="item-total">Rs. {item.price * cartItems[item._id]}</p>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item._id)}
                      className="remove-item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>

        <div className="cart-side">
          <div className="cart-summary">
            <div className="summary-header">
              <h2>Cart Summary</h2>
              <span className="summary-badge">Ready to order</span>
            </div>
            <div className="cart-summary-details">
              <div className="summary-item">
                <p>Subtotal</p>
                <p>Rs. {getTotalCartAmount()}</p>
              </div>
              <div className="summary-item">
                <p>Discount</p>
                <p>-Rs. {discount}</p>
              </div>
              <div className="summary-item">
                <p>Delivery Fee</p>
                <p style={{ color: deliveryFee === 0 ? "green" : "red" }}>Rs. {deliveryFee}</p>
              </div>
              <div className="summary-item total">
                <b>Total</b>
                <b>Rs. {Math.max(getTotalCartAmount() - discount + deliveryFee, 0)}</b>
              </div>
            </div>
            <button onClick={() => navigate("/order")} className="checkout-button">
              Checkout
            </button>
          </div>

          <div className="cart-coupon">
            <p className="coupon-title">Apply Coupon Code</p>
            <div className="coupon-input">
              <input
                type="text"
                placeholder="Enter promo code"
                value={couponCode}
                onChange={handleCouponCodeChange}
                disabled={couponApplied}
              />
              {couponApplied ? (
                <button onClick={removeCouponCode} className="apply-coupon-button">
                  Remove
                </button>
              ) : (
                <button onClick={applyCouponCode} className="apply-coupon-button">
                  Apply
                </button>
              )}
            </div>
            <div className="coupon-info">
              <p>Apply "THIVFIRST" for free delivery</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
