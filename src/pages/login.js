import React, { useEffect, useContext } from'react';
import QueryString from 'qs';
import { useNavigate } from'react-router-dom';
import env
 from 'react-dotenv';
import "../css/login.css";
import MadeBy from '../components/made-by';
const SCOPES = 
    `user-read-private
    user-library-read
    user-top-read
    user-read-currently-playing
    user-library-modify
    user-follow-read
    user-follow-modify
    playlist-read-private
    playlist-read-collaborative
    playlist-modify-public
    playlist-modify-private
    `;
const REDIRECT_URI = 'https://idk-them.vercel.app/login';

const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

function Login() {
    const navigate = useNavigate();

    const getAuthCode = async () => {
        if (localStorage.getItem("authToken") !== null) {
            navigate('/');
        }

        const codeVerifier = generateRandomString(64);
        const sha256 = async (plain) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(plain)
            return window.crypto.subtle.digest('SHA-256', data)
          }
          const base64encode = (input) => {
            return btoa(String.fromCharCode(...new Uint8Array(input)))
              .replace(/=/g, '')
              .replace(/\+/g, '-')
              .replace(/\//g, '_');
          }
          const hashed = await sha256(codeVerifier)
          const codeChallenge = base64encode(hashed);
          
          window.localStorage.setItem('code_verifier', codeVerifier);
    
        try {
           const params = {
                    client_id: env.CLIENT_ID,
                    response_type: 'code',
                    redirect_uri: REDIRECT_URI,
                    scope: SCOPES,
                    code_challenge: codeChallenge,
                    code_challenge_method: 'S256',
                };
            const url = `https://accounts.spotify.com/authorize?${QueryString.stringify(params)}`;
            window.location.href = url;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
    const handleAuthCode = async () => {
        if(localStorage.getItem("authToken")!== null) {
            localStorage.getItem("authToken");
            navigate('/');
        }
        // check if we just got back a code
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            // We have a code, so we can now get the access token
            const codeVerifier = localStorage.getItem('code_verifier');
            const params = {
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI,
                client_id: env.CLIENT_ID,
                code_verifier: codeVerifier,
            };
            const url = `https://accounts.spotify.com/api/token`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(params),
            });
            const data = await response.json();
            if (response.status === 200) {
                // We have an access token, so we can now get the user's profile
                const accessToken = data.access_token;
                localStorage.setItem('authToken', accessToken);
                navigate('/');
            } else {
                // Something went wrong with the authentication
                console.error(data);
                return null;
            }
        }
    }

    useEffect(() => {
        // check if this page is being loaded from the callback page
        /* The code snippet you provided is part of a React component called `Login`. In this
        component, the `useEffect` hook is being used to perform certain actions when the component
        mounts. */
        if(localStorage.getItem('lastRateLimit') !== null) {
            // make sure it's been more than 1 minute since the last rate limit
            const lastRateLimit = localStorage.getItem('lastRateLimit');
            const currentTime = new Date().getTime();
            const min = currentTime - lastRateLimit;
            if(min > 60000) {
                localStorage.removeItem('lastRateLimit');
                localStorage.removeItem('numRequests');
            }
            else {
                alert('You have been rate limited by the Spotify API. Please wait a minute before trying again.', 'Time remaining: ', (60000 - (currentTime - lastRateLimit)) / 1000);
                navigate('/');
            }
        }

        // remove local storage items if they exist
        if(localStorage.getItem('authToken') === null) {
            localStorage.removeItem('playlists');
            localStorage.removeItem('playlistsObjs');
            localStorage.removeItem('savedTracks');
            localStorage.removeItem('savedAlbums');
            localStorage.removeItem('playlistTracks');
        }
        const authToken = handleAuthCode();
    }, []);

    return (
        <div className="login-root">
            <h1>Do I know them?</h1>
            <button id="login-spotify" onClick={async () => {
                // TODO: Set the auth tokens in the local storage
                // and set authenticated to true
                // Spotify login setup
                const authToken = await getAuthCode();
            }}>Login With Spotify</button>
            <MadeBy />
        </div>
    );
}

export default Login;