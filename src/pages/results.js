import React, { useEffect, useContext, useState } from'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../contexts/userContext';
import SearchContext from '../contexts/searchContext';

function Results() {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);
    const { artistID, updateArtistID } = useContext(SearchContext);
    const [ artistInfo, setArtistInfo ] = useState(null);

    const [isTopArtist, setIsTopArtist] = useState(false);
    const [ playlistsArtistIsIn, setPlaylistsArtistIsIn ] = useState([]);

    useEffect(() => {
        console.log("user", userInfo);
        console.log("artist", artistID);
        try {
            // we're gonna look for this artist now!
        fetch(`https://api.spotify.com/v1/artists/${artistID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            console.log(response.status);
            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }
            response.json().then(data => {
                console.log("ARTIST DATA", data);
                setArtistInfo(data);
            });
        });

        // does the user know this artist?
        fetch(`https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }
            response.json().then(data => {
                console.log(data);
                userInfo.updateUserFollowsSearchedArtist(data[0]);
            });
        });

        // is the artist in the user's top tracks?
        userInfo.userTopTracks.forEach(track => {
            if (track.artists[0].id === artistID) {
                userInfo.updateUserFollowsSearchedArtist(true);
                setIsTopArtist(true);
            } else {
                setIsTopArtist(false);
            }
        });

        console.log("USER INFO PLAYLISTS", userInfo.userPlaylists);
        let playlistMap = new Map();
        userInfo.userPlaylists.forEach(playlist => {
            // get tracks in playlist
            fetch(playlist.tracks.href, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            }).then(response => {
                if (response.status === 401) {
                    // if error occurs with bad access token, we need to redirect to login
                    navigate('/login');
                }
                response.json().then(data => {
                    data.items.forEach(item => {
                        if ((item.track? item.track.artists[0].id === artistID : false) && !playlistMap.has(playlist.id)) {
                            setPlaylistsArtistIsIn(prevState => [...prevState, playlist]);
                            playlistMap.set(playlist.id, true);
                            // exit the loop
                            return;
                        }
                    });
                });
            });
        });
        console.log("PLAYLISTS", playlistsArtistIsIn);

        } catch (error) {
            // if error occurs with bad access token, we need to redirect to login
            console.error('Error in results:', error);
        }
        
    }, []);

    return (
        <div>
            {artistInfo && playlistsArtistIsIn? (
                <div>
                    <h1>YOU KNOW THESE GUYS! </h1>
                    <h2>{artistInfo.name}</h2>
                    <img src={artistInfo.images[0].url} alt="artist" />
                    <p>{artistInfo.followers.total} followers</p>
                    <p>{artistInfo.genres}</p>
                    <p>{artistInfo.popularity}</p>
                    <p>{artistInfo.type}</p>
    
                    <h2>YOU FOLLOW THIS ARTIST: {userInfo.userFollowsSearchedArtist ? "YES" : "NO"}</h2>
                    <h2>THIS ARTIST IS IN YOUR TOP TRACKS: {isTopArtist ? "YES" : "NO"}</h2>
    
                    <h2>PLAYLISTS THIS ARTIST IS IN:</h2>
                    <ul>
                        {playlistsArtistIsIn.map(playlist => {
                            return (
                                <li key={playlist.id}>{playlist.name}</li>
                            );
                        })}
                    </ul>
                </div>
            ) : <div> Loading... </div> }
        </div>
    );
}

export default Results;