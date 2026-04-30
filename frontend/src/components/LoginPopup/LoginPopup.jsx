import React, { useContext, useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import { StoreContext } from '../../Context/StoreContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

const LoginPopup = ({ setShowLogin }) => {
    const { setToken, setUserName, url, loadCartData } = useContext(StoreContext);
    const [currState, setCurrState] = useState("Sign Up");
    const [data, setData] = useState({ name: "", email: "", password: "" });
    const navigate = useNavigate();

    const onChangeHandler = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData((prev) => ({ ...prev, [name]: value }));
    };

    const finishAuth = async (nextToken, user) => {
        setToken(nextToken);
        if (user?.name) {
            setUserName(user.name);
            localStorage.setItem("userName", user.name);
        }
        localStorage.setItem("token", nextToken);
        await loadCartData(nextToken);
        setShowLogin(false);
        navigate('/');
    };

    const onLogin = async (e) => {
        e.preventDefault();
        let new_url = url;
        if (currState === "Login") {
            new_url += "/api/user/login";
        } else {
            new_url += "/api/user/register";
        }
        try {
            const response = await axios.post(new_url, data);
            if (response.data.success) {
                await finishAuth(response.data.token, response.data.user);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        }
    };

    const onGoogleLoginSuccess = async (credentialResponse) => {
        try {
            const response = await axios.post(`${url}/api/user/google`, {
                credential: credentialResponse.credential,
            });

            if (response.data.success) {
                await finishAuth(response.data.token, response.data.user);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error("Google sign-in failed. Please try again.");
        }
    };

    const onGoogleLoginFailure = () => {
        toast.error("Google sign-in failed. Please try again.");
    };

    return (
        <div className='login-popup'>
            <form onSubmit={onLogin} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="Close" />
                </div>
                <div className="login-popup-inputs">
                    {currState === "Sign Up" && <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}
                    <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
                    <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
                </div>
                <div className="login-popup-condition">
                    <input type="checkbox" id="terms" required />
                    <label htmlFor="terms">Accept Terms & Conditions</label>
                </div>
                <button type="submit">{currState === "Login" ? "Login" : "Create account"}</button>
                <div className="google-login">
                    <GoogleLogin
                        onSuccess={onGoogleLoginSuccess}
                        onError={onGoogleLoginFailure}
                    />
                </div>
                {currState === "Login"
                    ? <p>Create a new account? <span onClick={() => setCurrState('Sign Up')}>Click here</span></p>
                    : <p>Already have an account? <span onClick={() => setCurrState('Login')}>Login here</span></p>
                }
            </form>
        </div>
    );
};

export default LoginPopup;
