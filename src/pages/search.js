import { React,useEffect, useState, useContext } from "react";
import SearchSuggest from "../components/search-suggest";
import UserContext from "../contexts/userContext";
import "../css/search.css";
import { useNavigate } from "react-router-dom";
import Logout from "../components/logout";

function Search({spotifyAuthToken}) {
    const navigate = useNavigate();
    const userInfo = useContext(UserContext);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [userId, setUserID] = useState(null);
    const [doneLoading, setDoneLoading] = useState(false);

    useEffect(() => {
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
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const getPlaylists = async () => {
            let response;
            try {
                let playlistsArr = [];
                response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists?offset=0&limit=50`, {
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
                }

                userInfo.updateUserPlaylists(playlistsArr);

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

        if (userId !== null) {
            getPlaylists();
        }

        let promises = [getUserInfo(), getTopTracks(), getFollowedArtists(), getSavedTracks()];
        Promise.all(promises).then(() => {
            setDoneLoading(true);
        }).catch(error => {
            console.error('Error fetching user data:', error);
            setDoneLoading(true);
        });
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