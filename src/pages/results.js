import React, { useEffect, useContext, useState } from'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../contexts/userContext';
import SearchContext from '../contexts/searchContext';
import AboutArtist from '../components/about-artist';
import Playlists from '../components/playlists';
import UserArtistState from '../components/user-artist-state';
import "../css/results.css"

function Results() {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);
    const { artistID, updateArtistID } = useContext(SearchContext);
    const [ artistInfo, setArtistInfo ] = useState(null);

    const [ isTopArtist, setIsTopArtist ] = useState(false);
    const [ playlistsArtistIsIn, setPlaylistsArtistIsIn ] = useState([]);
    const [ doneLoading, setDoneLoading ] = useState(false);
    const [ userKnowsArtist, setUserKnowsArtist ] = useState(false);

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
                    setUserKnowsArtist(data[0]);
                });
            });

            // is the artist in the user's top tracks?
            userInfo.userTopTracks.forEach(track => {
                track.artists.forEach(artist => {
                    console.log(artist.name);
                    if (artist.id === artistID) {
                        console.log('found artist in top tracks');
                        userInfo.updateUserFollowsSearchedArtist(true);
                        setIsTopArtist(true);
                        setUserKnowsArtist(true);
                    }
                });
            });

            let promises = [];
            let tracks = new Set();
            let playlistMap = new Map();
            for(let playlist of userInfo.userPlaylists) {
                new Promise(resolve => setTimeout(resolve, 500));
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
                                    setUserKnowsArtist(true);
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

        console.log(userKnowsArtist);
        setDoneLoading(true);
    }, []);

    return (
        <div className='results'>
            {doneLoading && artistInfo? (
                <div style={{width: '100%'}}>
                    <AboutArtist artistInfo={artistInfo} />

                    <UserArtistState userArtistState={isTopArtist? 0 : userKnowsArtist ? 1 : 2} />

                    <Playlists playlists={playlistsArtistIsIn} />
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