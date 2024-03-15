import { React,useEffect, useState, useContext } from "react";
import SearchSuggest from "../components/search-suggest";
import UserContext from "../contexts/userContext";
import "../css/search.css";
import { useNavigate } from "react-router-dom";
import Logout from "../components/logout";
import MadeBy from "../components/made-by.js";
import Loader from "../components/loader";
import information from "../images/information.png";
import Spotify_Logo from "../images/Spotify_Logo.png";
function Search() {
    const navigate = useNavigate();
    const userInfo = useContext(UserContext);
    const spotifyAuthToken = localStorage.getItem('authToken');
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [userId, setUserID] = useState(null);
    const [doneLoading, setDoneLoading] = useState(false);
    const [knownTopArtist, setKnownTopArtist] = useState(false);
    const [loaderString, setLoaderString] = useState("Getting your Spotify data...");

    const check429 = async (response) => {
        if(response.status === 429) {
            alert(`We've reached the rate limit, waiting to retry in 1 hour. Please wait and try again.`);
            // clear local storage and redirect to login
            localStorage.removeItem('authToken');
            localStorage.removeItem('playlists');
            localStorage.removeItem('code_verifier');
            navigate('/login');
            return;
        }
    }
    useEffect(() => {

        window.addEventListener('message', (event) => {
            // set done loading to true so we don't keep trying to fetch the user's data
            // check the message
            if(event.data === 'done') {
                setDoneLoading(true);
            }
        });

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
                localStorage.setItem('userID', data.id);
                userInfo.updateUserName(data.display_name);
                
                if(localStorage.getItem('playlists') === null) {
                    await getPlaylists(data.id);
                } else {
                    window.postMessage('done', '*');
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const getPlaylists = async (id) => {
            let response;
            let numRequests;
            if(localStorage.getItem('numRequests') !== null) {
                numRequests = parseInt(localStorage.getItem('numRequests'));
            } else {
                numRequests = 0;
            }

            if(localStorage.getItem('lastRateLimit') !== null) {
                let lastRateLimit = parseInt(localStorage.getItem('lastRateLimit'));
                let timeSinceRateLimit = Date.now() - lastRateLimit;
                if(timeSinceRateLimit < 60 * 1000) {
                    alert(`We've reached the rate limit, waiting to retry in 1 hour. Please wait and try again.`);
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('playlists');
                    localStorage.removeItem('code_verifier');
                    navigate('/');
                    return;
                } else {
                    localStorage.removeItem('lastRateLimit');
                    // set numRequests to 0
                    localStorage.setItem('numRequests', 0);
                }
            }

            if(numRequests > 4) {
                alert(`We've reached the rate limit, waiting to retry in 1 hour. Please wait and try again.`);
                localStorage.setItem('lastRateLimit', Date.now());
                localStorage.removeItem('authToken');
                localStorage.removeItem('playlists');
                localStorage.removeItem('code_verifier');
                navigate('/login');
            } else {
                localStorage.setItem('numRequests', numRequests + 1);
            }

            try {
                let playlistsGetter = async () => {
                    let playlistsMap = new Map();
                    response = await fetch(`https://api.spotify.com/v1/users/${id}/playlists?offset=0&limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    
                    check429(response);

                    let data = await response.json();
                    for (const playlist of data.items) {
                        // set the playlist id as the key and the playlist object as the value
                        playlistsMap.set(playlist.id, playlist);
                    }

                    let offset = 50;
                    let timeout = 0;
                    while(data.items.length === 50) {
                        await new Promise((resolve) => setTimeout(resolve, timeout));
                        response = await fetch(`https://api.spotify.com/v1/users/${id}/playlists?&offset=${offset}&limit=50`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${spotifyAuthToken}`
                            }
                        });
                        
                        check429(response);
                        data = await response.json();
                        for (const playlist of data.items) {
                            // set the playlist id as the key and the playlist object as the value
                            playlistsMap.set(playlist.id, playlist);
                        }

                        offset += 50;
                        timeout += 5000;

                        if(timeout > 15000) {
                            setLoaderString("Usually takes about 1 minute to get this stuff... but might take longer for you 😶 ");
                        }
                    }
    
                    // get all of the user's personal playlists
                    response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    check429(response);
                    data = await response.json();
                    for (const playlist of data.items) {
                        // set the playlist id as the key and the playlist object as the value
                        playlistsMap.set(playlist.id, playlist);
                    }
    
                    offset = 50;
                    timeout = 0;
                    while(data.items.length === 50) {
                        await new Promise((resolve) => setTimeout(resolve, timeout));
                        response = await fetch(`https://api.spotify.com/v1/me/playlists?limit=50&offset=${offset}`, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${spotifyAuthToken}`
                            }
                        });

                        check429(response);
                        data = await response.json();
                        for(const playlist of data.items) {
                            playlistsMap.set(playlist.id, playlist);
                        }

                        offset += 50;
                        timeout += 5000;

                        if(timeout > 15000) {
                            setLoaderString("👀 you have alot of data danggggg... Going to take a bit more time...");
                        }
                    }
                    
                    let plainObject = {};
                    playlistsMap.forEach((value, key) => {
                        plainObject[key] = value;
                    });

                    localStorage.setItem('playlistsObjs', JSON.stringify(plainObject));
                    return playlistsMap;
                }

                playlistsGetter().then(async (map) => {
                    let tracks = await getAllTracksForAllPlaylists(Array.from(map.values()));
                    // Convert playlistMap to a plain object before storing in localStorage
                    const plainObject = {};
                    for (const [key, value] of tracks) {
                        plainObject[key] = value;
                    }

                    localStorage.setItem('playlists', JSON.stringify(plainObject));
                    window.postMessage('done', '*');
                });

                return true;
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
                return true;
            } catch (error) {
                console.error('Error fetching top tracks:', error);
            }
        };

        const getFollowedArtists = async () => {
            try {
                let response = await fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=50`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${spotifyAuthToken}`
                    }
                });
                let data = await response.json();
                let lastArtist = data.artists.items[data.artists.items.length - 1];
                let followedArtists = data.artists.items;

                while(data.artists.items.length === 50) {
                    response = await fetch(`https://api.spotify.com/v1/me/following?type=artist&limit=50&after=${lastArtist.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    data = await response.json();
                    lastArtist = data.artists.items[data.artists.items.length - 1];
                    followedArtists = followedArtists.concat(data.artists.items);
                }
                
                userInfo.updateUserFollowedArtists(followedArtists);
                return;
            } catch (error) {
                console.error('Error fetching followed artists:', error);
            }
        };

        const getSavedTracks = async () => {
            try {
                let response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${spotifyAuthToken}`
                    }
                });
                check429(response);
                let data = await response.json();
                // just keep some of the data
                data.items = data.items.map(track => {
                    // get the artists for the track
                    let artists = track.track.artists.map(artist => {
                        return {
                            name: artist.name,
                            id: artist.id
                        };
                    });
                    return {
                        name: track.track.name,
                        id: track.track.id,
                        artists: artists,
                        album: {
                            name: track.track.album.name,
                            id: track.track.album.id
                        },
                        trackURL: track.track.external_urls.spotify
                    };
                });
                let savedTracks = data.items;

                let offset = 50;
                let timeout = 0;
                while(data.items.length === 50) {
                    await new Promise((resolve) => setTimeout(resolve, timeout));
                    response = await fetch(`https://api.spotify.com/v1/me/tracks?limit=50&offset=${offset}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    check429(response);
                    data = await response.json();
                    data.items = data.items.map(track => {
                        // get the artists for the track
                        let artists = track.track.artists.map(artist => {
                            return {
                                name: artist.name,
                                id: artist.id
                            };
                        });
                        return {
                            name: track.track.name,
                            id: track.track.id,
                            artists: artists,
                            album: {
                                name: track.track.album.name,
                                id: track.track.album.id
                            },
                            trackURL: track.track.external_urls.spotify
                        };
                    }
                    );
                    savedTracks = savedTracks.concat(data.items);
                    offset += 50;
                    timeout += 3000;

                    if(timeout > 10000) {
                        setLoaderString("This is taking longer than we thought... still getting your Spotify data...");
                    }
                }

                localStorage.setItem('savedTracks', JSON.stringify(savedTracks));
                return;
            } catch (error) {
                console.error('Error fetching saved tracks:', error);
            }
        };
        
        const getSavedAlbums = async () => {
            try {
                let response = await fetch(`https://api.spotify.com/v1/me/albums?limit=50`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${spotifyAuthToken}`
                    }
                });
                check429(response);
                let data = await response.json();
                // just keep some of the data
                data.items = data.items.map(album => {
                    return {
                        name: album.album.name,
                        id: album.album.id,
                        artists: album.album.artists.map(artist => {
                            return {
                                name: artist.name,
                                id: artist.id
                            };
                        }),
                        images: album.album.images,
                        external_urls: {
                            spotify: album.album.external_urls.spotify
                        }
                    };
                });
                let savedAlbums = data.items;

                let offset = 50;
                while(data.items.length === 50) {
                    response = await fetch(`https://api.spotify.com/v1/me/albums?limit=50&offset=${offset}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${spotifyAuthToken}`
                        }
                    });
                    check429(response);
                    data = await response.json();
                    data.items = data.items.map(album => {
                        return {
                            name: album.album.name,
                            id: album.album.id,
                            artists: album.album.artists.map(artist => {
                                return {
                                    name: artist.name,
                                    id: artist.id
                                };
                            }),
                            images: album.album.images,
                            external_urls: {
                                spotify: album.album.external_urls.spotify
                            }
                        };
                    });
                    savedAlbums = savedAlbums.concat(data.items);
                    offset += 50;
                }

                localStorage.setItem('savedAlbums', JSON.stringify(savedAlbums));
                return;
            } catch (error) {
                console.error('Error fetching saved albums:', error);
            }
        }
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
            for (const playlist of playlists) {
                playlistMap.set(playlist.id, []);
            }
            
            for (const [key, value] of playlistMap) {
                let playlistToFind = playlists.find(playlist => playlist.id === key);
                let tracks = await getTracksForPlaylist(playlistToFind);
                tracks = tracks.map(track => {
                    // get the artists for the track
                    let artists = track.track?.artists.map(artist => {
                        return {
                            name: artist.name,
                            id: artist.id
                        };
                    });
                    return {
                        name: track.track?.name,
                        id: track.track?.id,
                        artists: artists,
                        album: {
                            name: track.track?.album.name,
                            id: track.track?.album.id
                        },
                        playlistImg: playlistToFind.images[0].url,
                        trackURL: track.track?.external_urls.spotify,
                    };
                });
                playlistMap.set(key, tracks);
            }
            
            userInfo.updatePlaylistTracks(playlistMap);
            return playlistMap;
        };

        const fetchData = async () => {
            let promises = [getTopTracks(), getFollowedArtists(), getSavedTracks(), getUserInfo(), getSavedAlbums()];

            // get the user's playlists after getting the user's info
            await Promise.all(promises);

            userInfo.updateInitDone(true);
        };

        fetchData();
    }, []);

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
            <div id="info">
                <div id="info-box">
                    <p>Spotify is used to fetch all your listening data and playlists. We do not store any of your data. The app stores everything locally to your browser, so none of your information is taken out of here!</p>
                    <img src={Spotify_Logo} alt="Information" />
                </div>
                <button id="info-button" onClick={() => {
                    let infoBox = document.getElementById('info-box');
                    if(infoBox.style.display === "none") {
                        infoBox.style.display = "block";
                    } else {
                        infoBox.style.display = "none";
                    }
                }
                }>
                    <img src={information} alt="Information" />
                </button>
            </div>
            {   
                (doneLoading) ? (
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
            </div>) : null} </div> ) : <Loader string={loaderString} />
            }
            <Logout />
            <MadeBy />
        </div>
    );
}

export default Search;