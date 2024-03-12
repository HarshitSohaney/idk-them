import { React,useEffect, useState, useContext } from "react";
import SearchSuggest from "../components/search-suggest";
import UserContext from "../contexts/userContext";
import "../css/search.css";
import { useNavigate } from "react-router-dom";
import env
 from 'react-dotenv';
import Logout from "../components/logout";
function Search() {
    const navigate = useNavigate();
    const userInfo = useContext(UserContext);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [userId, setUserID] = useState(null);
    const [doneLoading, setDoneLoading] = useState(false);

    const [authToken, setAuthToken] = useState(null);

    const spotifyAuthToken = localStorage.getItem('authToken');

    useEffect(() => {
        // See if we need a refresh token check if the token is expired
        if(new Date(localStorage.getItem('expiresAt')) < Date.now()) {
            // send a request to the server to refresh the token
            let getNewToken = async () => {
                const refreshToken = localStorage.getItem('refreshToken');
                const url = "https://accounts.spotify.com/api/token";

                const payload = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: refreshToken,
                    client_id: env.CLIENT_ID
                }),
                }

                try {
                    let response = await fetch(url, payload);
                    let data = await response.json();
                    if (response.status === 200) {
                        localStorage.setItem('authToken', data.access_token);
                        localStorage.setItem('expiresIn', data.expires_in);
                        localStorage.setItem('setTime', new Date().getTime());

                        setAuthToken(data.access_token);
                        return data.access_token;
                    }
                    else {
                        console.error('Error refreshing token:', data);
                        navigate('/login');
                    }
                } catch (error) {
                    console.error('Error refreshing token:', error);
                    navigate('/login');
                }
            }
            getNewToken();
        } else {
            setAuthToken(localStorage.getItem('authToken'));
        }

        const getUserInfo = async () => {
            try {
                let response = await fetch('https://api.spotify.com/v1/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${spotifyAuthToken}`
                    }
                });

                if (response.status === 401) {
                    localStorage.removeItem('authToken');
                    navigate('/login');
                    return;
                }

                const data = await response.json();
                userInfo.updateUserID(data.id);
                setUserID(data.id);
                userInfo.updateUserName(data.display_name);
                return data.id;
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const getTracksForPlaylist = async (playlist) => {
            let response = await fetch(playlist.tracks.href, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            });
            let data = await response.json();
            return data.items;
        };

        const getAllTracksForAllPlaylists = async (playlists) => {
            let playlistMap = new Map();

            let promises = [];
            const doTrackAdding = async (playlists) => {
                playlists.forEach(playlist => {
                    playlistMap.set(playlist.id, []);
                });
                playlistMap.forEach(async (value, key) => {
                    let tracks = await getTracksForPlaylist(playlists.find(playlist => playlist.id === key));
                    playlistMap.set(key, tracks);
                });
            }

            promises.push(doTrackAdding(playlists));

            return Promise.all(promises).then(() => {
                userInfo.updatePlaylistTracks(playlistMap);
                return playlistMap;
            });
        };

        const getPlaylists = async (id) => {
            let response;
            try {
                let playlistsGetter = async () => {
                    let playlistsArr = [];
                    response = await fetch(`https://api.spotify.com/v1/users/${id}/playlists?offset=0&limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
    
                    let data = await response.json();
                    playlistsArr = data.items;
                    if (playlistsArr.length === 50) {
                        response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?offset=50&limit=50`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${spotifyAuthToken}`
                            }
                        });
    
                        data = await response.json();
                        playlistsArr = playlistsArr.concat(data.items);
                    }
    
                    // get all of the user's personal playlists
                    response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    data = await response.json();
                    playlistsArr = playlistsArr.concat(data.items);
    
                    let offset = 50;
                    while(data.items.length === 50) {
                        response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${spotifyAuthToken}`
                            }
                        });
                        data = await response.json();
                        playlistsArr = playlistsArr.concat(data.items);
                        offset += 50;
                        new Promise(resolve => setTimeout(resolve, 1000));
                    }
    
                    userInfo.updateUserPlaylists(playlistsArr);
                    return playlistsArr;
                }

                let playlistsArr = await playlistsGetter();
                let promises = [];

                promises.push(getAllTracksForAllPlaylists(playlistsArr));
                
                // get the return value of the promises
                return Promise.all(promises).then((values) => {
                    console.log('Values:', values);
                    return values;
                });
            } catch (error) {
                console.error('Error fetching playlists:', error);
                // if we have rate limited, we need to redirect to login
                if (response.status === 429) {
                    // get amount of time we need to wait
                    alert(`We've reached the rate limit, waiting to retry in 1 hour. Please wait and try again.`);
                    await new Promise((resolve) => setTimeout(resolve, 60 * 60 * 1000));
                    window.location.reload();
                }
            }
        };

        // Setup or open the indexedDB
        // Open or create IndexedDB database
        var request = indexedDB.open('user_data', 1);
        request.onerror = function(event) {
            console.error('Error opening indexedDB:', event);
        };

        request.onupgradeneeded = function(event) {
            // we will be storing the playlists here to avoid multiple calls
            // to the spotify api
            var db = event.target.result;

            // Create an objectStore for this database
            var objectStore = db.createObjectStore('playlists', { keyPath: 'id' });
        }

        request.onsuccess = function(event) {
            var db = event.target.result;

            function addPlaylist(playlist) {
                // playlist is an object with id and tracks
                var transaction = db.transaction(['playlists'], 'readwrite');
                var objectStore = transaction.objectStore('playlists');
                var request = objectStore.add(playlist);
                request.onsuccess = function(event) {
                    console.log('Playlist added to indexedDB');
                }
                request.onerror = function(event) {
                    console.error('Error adding playlist to indexedDB:', event.target.errorCode, event.target.error);
                }
    
            }

            function checkIfPlaylistsInIndexedDB(callback) {
                var transaction = db.transaction(['playlists'], 'readonly');
                var objectStore = transaction.objectStore('playlists');
                var request = objectStore.getAll();
                request.onsuccess = function(event) {
                    // if we have playlists in indexedDB return true
                    // else return false
                    return callback(request.result.length > 0);
                }
            }
            
            getUserInfo().then(id => {
                // fetch playlists from the spotify api if they are not in indexedDB
                checkIfPlaylistsInIndexedDB((playlistsInIndexedDB) => {
                    if(playlistsInIndexedDB) {
                        let promises = [];

                        promises.push(getPlaylists(id));
                        Promise.all(promises).then((playlists) => {
                            // playlists[0] is a map of playlistID to [track1, track2, ...]
                            // add to indexedDB
                            console.log('Playlists adding to db:', playlists[0]);
                            // go through each playlist and add it to indexedDB
                            playlists[0].forEach(([tracks, playlistID]) => {
                                console.log('Adding playlist to indexedDB:', playlistID, tracks);
                                addPlaylist({id: playlistID, tracks: tracks});
                            });
                        });
                    }
                });}
            );
        }
    }, []);

    useEffect(() => {
        if(userInfo.initDone) {
            setDoneLoading(true);
        }
        else {
            const getTopTracks = async () => {
                try {
                    let response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    const data = await response.json();
                    userInfo.updateUserTopTracks(data.items);
                } catch (error) {
                    console.error('Error fetching top tracks:', error);
                }
            };
    
            const getFollowedArtists = async () => {
                try {
                    let response = await fetch(`https://api.spotify.com/v1/me/following?type=artist`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    const data = await response.json();
                    userInfo.updateUserFollowedArtists(data.artists.items);
                } catch (error) {
                    console.error('Error fetching followed artists:', error);
                }
            };
    
            const getSavedTracks = async () => {
                try {
                    let response = await fetch(`https://api.spotify.com/v1/me/tracks`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    const data = await response.json();
                    userInfo.updateSavedTracks(data.items);
                } catch (error) {
                    console.error('Error fetching saved tracks:', error);
                }
            };

            let promises = [getTopTracks(), getFollowedArtists(), getSavedTracks()];
            Promise.all(promises).then(() => {
                setDoneLoading(true);
                userInfo.updateInitDone(true);
            }).catch(error => {
                console.error('Error fetching user data:', error);
                setDoneLoading(true);
            });
        }
    }, [spotifyAuthToken, userId]);

    useEffect(() => {
        if(searchTerm !== "" && searchTerm.length > 2 && spotifyAuthToken !== null) {
            // We are going to search a user's library and recent listening history to see if they know a band
            // We are going to use the Spotify API to search for a track with the name of the band

            // get artist ID based on band name
            const artistURL = `https://api.spotify.com/v1/search?q=${searchTerm}&type=artist&limit=5`;
            fetch(artistURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            })
            .then(response => {
                if(response.status === 200) {
                    // We have an access token, so we can now get the user's profile
                    response.json().then(data => {
                        setSearchResults(data.artists.items);
                    });
                    
                } else {
                    // Artist was not found
                    // let the user know that 
                    alert("Artist not found");
                }
            }
            )
            .catch(error => {
                console.error('Error:', error);
                return null;
            });    
        }
    }, [searchTerm, spotifyAuthToken, setSearchResults]);

    return (
        <div className="search">
            {
                doneLoading? (
                    <div>
                    <h1>Who are you looking for <span className="username">{userInfo.userName}</span>?</h1>
                    <input type="text" placeholder="Search for an Artist..." onChange={(event) => {
                        setSearchTerm(event.target.value);
                    }} />
            {searchResults.length > 0? (
            <div id="suggestions-table">
                    {searchResults.map((artist) => {
                        return (
                            <SearchSuggest key={artist.id} name={artist.name} images={artist.images} id={artist.id}/>
                        );
                    })}
            </div>) : null} </div> ) : <h1>Loading...</h1>
            }
            <Logout />
        </div>
    );
}

export default Search;