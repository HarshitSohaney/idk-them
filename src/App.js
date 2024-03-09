import './App.css';
import { React, useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import Results from './pages/results';
import Login from './pages/login';
import Search from './pages/search';
import AuthContext from './contexts/authContext';

function App() {
  const navigate = useNavigate();
  const [spotifyAuthToken, setSpotifyAuthToken] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    if(localStorage.getItem("authToken") !== null) {
      console.log("authToken exists");
      setSpotifyAuthToken(localStorage.getItem("authToken"));
    }
    else {
      setSpotifyAuthToken(null);  
    }
  }
  , []);

  return (
    <div className="App">
      {spotifyAuthToken? (
        <Search
        spotifyAuthToken={spotifyAuthToken}
        setSearchResults={setSearchResults}
        />
        ) : 
          navigate("/login")
          }
    </div>
  );
}

export default App;
