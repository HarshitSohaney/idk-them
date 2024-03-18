import './css/App.css';
import { React, useEffect, useState } from'react';
import { useNavigate } from'react-router-dom';
import Search from './pages/search';
import Results from './pages/results';
import UserContext from './contexts/userContext';
import SearchContext from './contexts/searchContext';

// V1.2.0

function App() {
  const navigate = useNavigate();
  const [spotifyAuthToken, setSpotifyAuthToken] = useState(null);
  const [userID, setUserID] = useState("");
  const [userName, setUserName] = useState("");
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [artistInfo, setArtistInfo] = useState({});
  const [savedTracks, setSavedTracks] = useState([]);
  const [savedAlbums, setSavedAlbums] = useState([]);
  const [userTopTracks, setUserTopTracks] = useState([]);
  const [userTopArtists, setUserTopArtists] = useState([]);
  const [userFollowedArtists, setUserFollowedArtists] = useState([]);
  const [userFollowsSearchedArtist, setUserFollowsSearchedArtist] = useState(false);
  const [artistID, setArtistID] = useState(null);
  const [initDone, setInitDone] = useState(false);
  const [playlistTracks, setPlaylistTracks] = useState([]);

  const updateUserID = (newUserID) => {
    setUserID(newUserID);
  }
  const updateUserName = (newUserName) => {
    setUserName(newUserName);
  }
  const updateUserPlaylists = (newUserPlaylists) => {
    setUserPlaylists(newUserPlaylists);
  }
  const updateArtistInfo = (newArtistInfo) => {
    setArtistInfo(newArtistInfo);
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
  const updateSavedAlbums = (newSavedAlbums) => {
    setSavedAlbums(newSavedAlbums);
  }

  const updateArtistID = (newArtistID) => {
    setArtistID(newArtistID);
  }

  const updateInitDone = (newInitDone) => {
    setInitDone(newInitDone);
  }

  const updatePlaylistTracks = (newPlaylistTracks) => {
    setPlaylistTracks(newPlaylistTracks);
  }

  const updateUserTopArtists = (newUserTopArtists) => {
    setUserTopArtists(newUserTopArtists);
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
    initDone,
    updateInitDone,
    playlistTracks,
    updatePlaylistTracks,
    savedAlbums,
    updateSavedAlbums,
    userTopArtists,
    updateUserTopArtists,
  };

  const searchContext = {
    artistID,
    updateArtistID,
  };

  useEffect(() => {
    if(localStorage.getItem("authToken") !== null) {
      setSpotifyAuthToken(localStorage.getItem("authToken"));
    }
    else {
      setSpotifyAuthToken(null);  
      navigate('/login');
    }
  }
  , []);

  return (
      <div className="App">
        {spotifyAuthToken? (
          <SearchContext.Provider value={searchContext}>
          <UserContext.Provider value={userContext}>
            {artistID? (
              <Results
                spotifyAuthToken={spotifyAuthToken}
                artistID={artistID}
              /> ) : (
                <Search
                spotifyAuthToken={spotifyAuthToken}
              />
              )}
          </UserContext.Provider>
          </SearchContext.Provider>
        ) : (
          navigate('/login')
        )}
      </div>
  );
}

export default App;
