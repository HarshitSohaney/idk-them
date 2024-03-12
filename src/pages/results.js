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
    const [ similarArtists, setSimilarArtists ] = useState([]);

    useEffect(() => {
        const getArtistInfo = async () => {
            let response = await fetch(`https://api.spotify.com/v1/artists/${artistID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            });

            let data = await response.json();

            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }
            setArtistInfo(data);
        }
        
        const doesUserKnowArtist = async () => {
            let response = await fetch(`https://api.spotify.com/v1/me/following/contains?type=artist&ids=${artistID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            });

            let data = await response.json();

            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }
            userInfo.updateUserFollowsSearchedArtist(data[0]);
            setUserKnowsArtist(data[0]);
        }

        const getSimilarArtists = async () => {
            let response = await fetch(`https://api.spotify.com/v1/artists/${artistID}/related-artists`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            });

            let data = await response.json();

            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }
            // just take the first 5 similar artists
            setSimilarArtists(data.artists.slice(0, 5));
        }

        try {
            setUserKnowsArtist(false);
            setDoneLoading(false);

            // is the artist in the user's top tracks?
            userInfo.userTopTracks.forEach(track => {
                track.artists.forEach(artist => {
                    if (artist.id === artistID) {
                        userInfo.updateUserFollowsSearchedArtist(true);
                        setIsTopArtist(true);
                        setUserKnowsArtist(true);
                    }
                });
            });

            let playlistsToAdd = [];
            const getAllPlaylists = async () => {
                // get playlists the artist is in
                const playlistMap = new Set();

                // Get playlists from indexDB
                // Setup or open the indexedDB
                var request = indexedDB.open('user_data', 1);
                request.onsuccess = function(event) {
                    var db = event.target.result;
                    var transaction = db.transaction(['playlists'], 'readwrite');
                    var objectStore = transaction.objectStore('playlists');
                    var request = objectStore.get('playlists');
                    request.onsuccess = function(event) {
                        var userInfo = request.result;

                        // Playlists may not exist yet
                        if (userInfo === undefined) {
                            return;
                        }
                        // format for playlistTracks is {playlistID: [track1, track2, ...]}
                        userInfo.playlistTracks.forEach((tracks, playlistID) => {
                            tracks.forEach(track => {
                                track.track?.artists.forEach(artist => {
                                    if (artist.id === artistID) {
                                        userInfo.userPlaylists.forEach(playlist => {
                                            if (playlist.id === playlistID) {
                                                playlistMap.add(playlistID);
                                            }
                                        }
                                        );
                                    }
                                });
                            });
                        }
                        );

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
                    };
                }
            }
            
            let promises = [getArtistInfo(), doesUserKnowArtist(), getSimilarArtists(), getAllPlaylists()];
            Promise.all(promises).then(() => {
                if(playlistsToAdd.length > 0) {
                    setUserKnowsArtist(true);
                }
                setDoneLoading(true);
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

                    <UserArtistState userArtistState={isTopArtist? 0 : userKnowsArtist ? 1 : 2} />

                    <Playlists playlists={playlistsArtistIsIn} type="playlist-item" />
                    <Playlists playlists={similarArtists} type="similar-artists" />
                </div>
            ) : <div> Loading... </div> }
            <div className='action-button'>
                <button onClick={() => {
                    updateArtistID(null);
                    navigate('/')
                }}> New Search </button>
            </div>
        </div>
    );
}

export default Results;