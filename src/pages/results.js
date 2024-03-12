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
                        userInfo.updateUserFollowsSearchedArtist(true);
                        setIsTopArtist(true);
                        setUserKnowsArtist(true);
                    }
                });
            });

            // get playlists the artist is in
            const playlistMap = new Set();

            // format for playlistTracks is {playlistID: [track1, track2, ...]}
            userInfo.playlistTracks.forEach((tracks, playlistID) => {
                tracks.forEach(track => {
                    track.track?.artists.forEach(artist => {
                        if (artist.id === artistID) {
                            userInfo.userPlaylists.forEach(playlist => {
                                if (playlist.id === playlistID) {
                                    playlistMap.add(playlistID);
                                    setUserKnowsArtist(true);
                                }
                            }
                            );
                        }
                    });
                });
            }
            );

            let playlistsToAdd = [];
            let addedPlaylists = new Set();
            playlistMap.forEach(playlistID => {
                userInfo.userPlaylists.forEach(playlist => {
                    if (playlist.id === playlistID && !addedPlaylists.has(playlistID)) {
                        playlistsToAdd.push(playlist);
                        addedPlaylists.add(playlistID);
                    }
                });
            });

            setPlaylistsArtistIsIn(playlistsToAdd);
            setDoneLoading(true);
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

                    <UserArtistState userArtistState={isTopArtist? 0 : userKnowsArtist ? 2 : 1} />

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