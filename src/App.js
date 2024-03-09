import './App.css';
import { React, useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import Search from './pages/search';
import UserContext from './contexts/userContext';

function App() {
  const navigate = useNavigate();
  const [spotifyAuthToken, setSpotifyAuthToken] = useState(null);
  const [userID, setUserID] = useState("");
  const [userName, setUserName] = useState("");
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [artistInfo, setArtistInfo] = useState({});
  const [savedTracks, setSavedTracks] = useState([]);
  const [userTopTracks, setUserTopTracks] = useState([]);
  const [userFollowedArtists, setUserFollowedArtists] = useState([]);
  const [userFollowsSearchedArtist, setUserFollowsSearchedArtist] = useState(false);

  const updateUserID = (newUserID) => {
    setUserID(newUserID);
  }
  const updateUserName = (newUserName) => {
    setUserName(newUserName);
  }
  const updateUserPlaylists = (newUserPlaylists) => {
    setUserPlaylists(newUserPlaylists);
    console.log(newUserPlaylists);
  }
  const updateArtistInfo = (newArtistInfo) => {
    setArtistInfo(newArtistInfo);
    console.log(newArtistInfo);
  }
  const updateSavedTracks = (newSavedTracks) => {
    setSavedTracks(newSavedTracks);
  }
  const updateUserTopTracks = (newUserTopTracks) => {
    setUserTopTracks(newUserTopTracks);
  }
  const updateUserFollowedArtists = (newUserFollowedArtists) => {
    setUserFollowedArtists(newUserFollowedArtists);
  }
  const updateUserFollowsSearchedArtist = (newUserFollowsSearchedArtist) => {
    setUserFollowsSearchedArtist(newUserFollowsSearchedArtist);
  }

  const userContext = {
    userID,
    updateUserID,
    userName,
    updateUserName,
    userPlaylists,
    updateUserPlaylists,
    artistInfo,
    updateArtistInfo,
    savedTracks,
    updateSavedTracks,
    userTopTracks,
    updateUserTopTracks,
    userFollowedArtists,
    updateUserFollowedArtists,
    userFollowsSearchedArtist,
    updateUserFollowsSearchedArtist,
  };

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

  useEffect(() => {
    console.log(userName);
  }, [userName]);
  return (
    
      <div className="App">
        {spotifyAuthToken? (
          <UserContext.Provider value={userContext}>
             <Search
              spotifyAuthToken={spotifyAuthToken}
            />
          </UserContext.Provider>
          ) : 
            navigate("/login")
            }
      </div>
  );
}

export default App;
