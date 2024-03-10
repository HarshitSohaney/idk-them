import React, { useEffect, useContext, useState } from'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../contexts/userContext';
import SearchContext from '../contexts/searchContext';
import AboutArtist from '../components/about-artist';
import "../css/results.css"

function Results() {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);
    const { artistID, updateArtistID } = useContext(SearchContext);
    const [ artistInfo, setArtistInfo ] = useState(null);

    const [isTopArtist, setIsTopArtist] = useState(false);
    const [ playlistsArtistIsIn, setPlaylistsArtistIsIn ] = useState([]);
    const [ doneLoading, setDoneLoading ] = useState(false);

    useEffect(() => {
        try {
            // we're gonna look for this artist now!
            fetch(`https://api.spotify.com/v1/artists/${artistID}`, {
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

            let promises = [];
            let tracks = new Set();
            let playlistMap = new Map();
            for(let playlist of userInfo.userPlaylists) {
                promises.push(
                // get tracks in playlist
                fetch(playlist.tracks.href, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${spotifyAuthToken}`
                    }
                }).then(response => {
                    if (response.status === 401) {
                        localStorage.removeItem('authToken');
                        // if error occurs with bad access token, we need to redirect to login
                        navigate('/login');
                    }
                    response.json().then(data => {
                        for(let item of data.items? data.items : []) {
                            item.track?.artists.forEach(artist => {
                                if(artist.id === artistID && !playlistMap.has(playlist.id)) {
                                    playlistMap.set(playlist.id, playlist);
                                    return;
                                }
                            });
                        }
                    });
                }));
            }

            Promise.all(promises).then(() => {
                setPlaylistsArtistIsIn(Array.from(playlistMap.values()));
                setDoneLoading(true);
            }).catch(error => {
                console.error('Error fetching playlists:', error);
            });

        } catch (error) {
            // if error occurs with bad access token, we need to redirect to login
            console.error('Error in results:', error);
        }
        
        setDoneLoading(true);
    }, []);

    return (
        <div className='results'>
            {doneLoading && artistInfo? (
                <div style={{width: '100%'}}>
                    <AboutArtist artistInfo={artistInfo} />
    
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
            <div>
                <input type="button" value="Back to Search" onClick={() => {
                    updateArtistID(null);
                    navigate('/')
                }} />
            </div>
        </div>
    );
}

export default Results;