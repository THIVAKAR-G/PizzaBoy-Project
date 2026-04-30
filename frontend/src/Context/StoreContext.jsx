import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import { food_list, menu_list } from "../assets/assets";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const url = "http://localhost:4000";
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState(localStorage.getItem("token") || "");
    const [userName, setUserName] = useState(localStorage.getItem("userName") || "");

    // Add item to the cart
    const addToCart = async (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: prev[itemId] ? prev[itemId] + 1 : 1,
        }));
        if (token) {
            await axios.post(`${url}/api/cart/add`, { itemId }, { headers: { token } });
        }
    };

    // Remove item from the cart
    const removeFromCart = async (itemId) => {
        setCartItems((prev) => ({
            ...prev,
            [itemId]: prev[itemId] > 1 ? prev[itemId] - 1 : 0,
        }));
        if (token) {
            await axios.post(`${url}/api/cart/remove`, { itemId }, { headers: { token } });
        }
    };

    // Calculate total cart amount
    const getTotalCartAmount = () => {
        return Object.keys(cartItems).reduce((total, itemId) => {
            const item = food_list.find((product) => product._id === itemId);
            if (!item || !cartItems[itemId]) {
                return total;
            }
            return total + item.price * cartItems[itemId];
        }, 0);
    };

    // Load cart data
    const loadCartData = async (token) => {
        try {
            const response = await axios.post(`${url}/api/cart/get`, {}, { headers: { token } });
            setCartItems(response.data.cartData);
        } catch (error) {
            console.error("Error loading cart data", error);
        }
    };

    const loadUserProfile = async (token) => {
        try {
            const response = await axios.get(`${url}/api/user/me`, { headers: { token } });

            if (response.data.success && response.data.user?.name) {
                setUserName(response.data.user.name);
                localStorage.setItem("userName", response.data.user.name);
            }
        } catch (error) {
            console.error("Error loading user profile", error);
        }
    };

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token);
            loadCartData(token); // Load cart data on token change
            if (!userName) {
                loadUserProfile(token);
            }
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            setCartItems({}); // Clear cart if no token
            setUserName("");
        }
    }, [token]);

    const contextValue = {
        url,
        food_list,
        menu_list,
        cartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        token,
        setToken,
        loadCartData,
        setCartItems,
        userName,
        setUserName,
        loadUserProfile,
    };

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    );
};

export default StoreContextProvider;
