import React, { useEffect, useContext, useState } from'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../contexts/userContext';
import SearchContext from '../contexts/searchContext';
import AboutArtist from '../components/about-artist';
import Playlists from '../components/playlists';
import UserArtistState from '../components/user-artist-state';
import "../css/results.css"
import SongsYouKnow from '../components/songs-you-know';

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
    const [tracksUserKnows, setTracksUserKnows] = useState({});

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

            let promises = [getArtistInfo(), doesUserKnowArtist(), getSimilarArtists()];

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

            // get playlists the artist is in
            const playlistMap = new Set();

            // get playlists from local storage
            let playlistsToAdd = [];
            let tracksMap = new Map();
            let playlists = localStorage.getItem('playlists');
            let playlistObjs = localStorage.getItem('playlistsObjs');
            playlists = JSON.parse(playlists);

            console.log('playlists:', playlistObjs);
            // playlists is an object with keys being the playlist id and values being an array of tracks
            for (let playlist in playlists) {
                playlists[playlist].forEach(track => {
                    track.artists?.forEach(artist => {
                        if (artist.id === artistID) {
                            playlistMap.add(playlist);

                            if (tracksMap.has(track.id)) {
                                let currTrack = tracksMap.get(track.id);
                                // push the playlist img url to the array
                                currTrack.playlists.push(JSON.parse(playlistObjs)[playlist].images[0].url);
                                tracksMap.set(track.id, currTrack);
                            } else {
                                let trackObj = {
                                    track: track,
                                    playlists: [JSON.parse(playlistObjs)[playlist].images[0].url]
                                };
                                tracksMap.set(track.id, trackObj);
                            }
                        }
                    });
                });
            }

            playlistMap.forEach(playlist => {
                playlistsToAdd.push(JSON.parse(playlistObjs)[playlist]);
            });

            setPlaylistsArtistIsIn(playlistsToAdd);
            setTracksUserKnows(tracksMap);
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
    }, []);

    return (
        <div className='results'>
            {doneLoading && artistInfo? (
                <div style={{width: '100%'}}>
                    <AboutArtist artistInfo={artistInfo} />

                    <UserArtistState userArtistState={isTopArtist? 0 : userKnowsArtist ? 1 : 2} />

                    <Playlists playlists={playlistsArtistIsIn} type="playlist-item" />
                    {userKnowsArtist? <SongsYouKnow tracks={tracksUserKnows} /> : null} 
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