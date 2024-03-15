import React, { useEffect, useContext, useState } from'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserContext from '../contexts/userContext';
import SearchContext from '../contexts/searchContext';
import AboutArtist from '../components/about-artist';
import Playlists from '../components/playlists';
import UserArtistState from '../components/user-artist-state';
import "../css/results.css"
import SongsYouKnow from '../components/songs-you-know';
import Loader from '../components/loader';
import AddPlaylist from '../components/add-playlist';

function Results() {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);
    const { artistID, updateArtistID } = useContext(SearchContext);
    const [ artistInfo, setArtistInfo ] = useState(null);

    const [ isTopArtist, setIsTopArtist ] = useState(false);
    const [ playlistsArtistIsIn, setPlaylistsArtistIsIn ] = useState([]);
    const [ albumsArtistIsIn, setAlbumsArtistIsIn ] = useState([]);
    const [ doneLoading, setDoneLoading ] = useState(false);
    const [ userKnowsArtist, setUserKnowsArtist ] = useState(false);
    const [ similarArtists, setSimilarArtists ] = useState([]);
    const [ savedTracksUserHas, setSavedTracksUserHas ] = useState({});
    const [ tracksUserKnows, setTracksUserKnows ] = useState({});

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
            if (data[0] === true) {
                setUserKnowsArtist(true);
            }
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
            const albumsMap = new Map();
            // get playlists from local storage
            let playlistsToAdd = [];
            let tracksMap = new Map();
            let playlists = localStorage.getItem('playlists');
            let playlistObjs = localStorage.getItem('playlistsObjs');
            let albums = localStorage.getItem('savedAlbums');
            let savedTracks = localStorage.getItem('savedTracks');
            savedTracks = JSON.parse(savedTracks);
            albums = JSON.parse(albums);
            playlists = JSON.parse(playlists);

            // playlists is an object with keys being the playlist id and values being an array of tracks
            for (let playlist in playlists) {
                playlists[playlist].forEach(track => {
                    track.artists?.forEach(artist => {
                        if (artist.id === artistID) {
                            playlistMap.add(playlist);

                            if (tracksMap.has(track.id)) {
                                let currTrack = tracksMap.get(track.id);
                                // push the playlist img url to the array
                                currTrack.playlists.push(JSON.parse(playlistObjs)[playlist].images[0]?.url);
                                tracksMap.set(track.id, currTrack);
                            } else {
                                let trackObj = {
                                    track: track,
                                    playlists: [JSON.parse(playlistObjs)[playlist].images[0]?.url]
                                };
                                tracksMap.set(track.id, trackObj);
                            }
                        }
                    });
                });
            }
            
            let savedTracksMap = new Map();
            for(let track of savedTracks) {
                track.artists.forEach(artist => {
                    if (artist.id === artistID) {
                        setUserKnowsArtist(true);
                        savedTracksMap.set(track.id, {
                            track: track,
                            playlists: []
                        });
                    }
                });
            }

            albums.forEach(album => {
                album.artists.forEach(artist => {
                    if (artist.id === artistID) {
                        setUserKnowsArtist(true);
                        albumsMap.set(album.id, album);
                    }
                });
            });

            let albumsToAdd = [];   
            albumsMap.forEach(album => {
                albumsToAdd.push(album);
            });
            setAlbumsArtistIsIn(albumsToAdd);
            playlistMap.forEach(playlist => {
                playlistsToAdd.push(JSON.parse(playlistObjs)[playlist]);
            });

            setPlaylistsArtistIsIn(playlistsToAdd);
            setTracksUserKnows(tracksMap);
            setSavedTracksUserHas(savedTracksMap);
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
                    <Playlists playlists={albumsArtistIsIn} type="saved-albums" />
                    {!userKnowsArtist ? <AddPlaylist artistID={artistID} /> : null}
                    {userKnowsArtist && tracksUserKnows.size > 0 ? <SongsYouKnow tracks={tracksUserKnows} type={"playlists-tracks"}/> : null}
                    {userKnowsArtist && savedTracksUserHas.size > 0 ? <SongsYouKnow tracks={savedTracksUserHas} type={"saved-tracks"} /> : null}
                    <Playlists playlists={similarArtists} type="similar-artists" />
                </div>
            ) : <Loader string={"Finding out if you know them!!"}/> }
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