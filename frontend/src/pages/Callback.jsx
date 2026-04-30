import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Parse the URL query parameters
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        try {
          // Send the code to your backend to exchange for a token
          const response = await axios.post('/api/auth/google/callback', { code });

          // Save the token to local storage or context
          localStorage.setItem('token', response.data.token);

          // Redirect to the home page or another appropriate page
          navigate('/');
        } catch (error) {
          // Handle authentication error
          console.error('Authentication error:', error);
        }
      } else {
        // Handle case where no code is present
        console.error('No authorization code found in URL');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div>
      <h2>Processing authentication...</h2>
    </div>
  );
};

export default AuthCallback;
