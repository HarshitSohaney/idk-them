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
import LZString from 'lz-string';

function Results() {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);
    const { artistID, updateArtistID } = useContext(SearchContext);
    const [ artistInfo, setArtistInfo ] = useState(null);

    const [ isTopArtistWithTrack, setIsTopArtistWithTrack ] = useState(false);
    const [ isTopArtist, setIsTopArtist ] = useState(false);
    const [ topArtistIndex, setTopArtistIndex ] = useState(-1);
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
                        setIsTopArtistWithTrack(true);
                        setUserKnowsArtist(true);
                    }
                });
            });

            userInfo.userTopArtists.forEach(artist => {
                if (artist.id === artistID) {
                    // save index of the artist in the user's top artists
                    let index = userInfo.userTopArtists.indexOf(artist);
                    setTopArtistIndex(index);
                    userInfo.updateUserFollowsSearchedArtist(true);
                    setIsTopArtist(true);
                    setUserKnowsArtist(true);
                }
            }
            );

            // get playlists the artist is in
            const playlistMap = new Set();
            const albumsMap = new Map();
            // get playlists from local storage
            let playlistsToAdd = [];
            let tracksMap = new Map();
            let playlists = localStorage.getItem('playlists');
            playlists = LZString.decompressFromUTF16(playlists);
            playlists = JSON.parse(playlists);

            let playlistObjs = localStorage.getItem('playlistsObjs');
            playlistObjs = LZString.decompressFromUTF16(playlistObjs);
            playlistObjs = JSON.parse(playlistObjs);

            let albums = localStorage.getItem('savedAlbums');
            albums = LZString.decompressFromUTF16(albums);
            albums = JSON.parse(albums);

            let savedAlbumTracks = localStorage.getItem('savedAlbumTracks');
            savedAlbumTracks = LZString.decompressFromUTF16(savedAlbumTracks);
            savedAlbumTracks = JSON.parse(savedAlbumTracks);

            let savedTracks = localStorage.getItem('savedTracks');
            savedTracks = LZString.decompressFromUTF16(savedTracks);
            savedTracks = JSON.parse(savedTracks);
            // playlists is an object with keys being the playlist id and values being an array of tracks
            for (let playlist in playlists) {
                playlists[playlist].forEach(track => {
                    track.artists?.forEach(artist => {
                        if (artist.id === artistID) {
                            playlistMap.add(playlist);

                            if (tracksMap.has(track.id)) {
                                let currTrack = tracksMap.get(track.id);
                                // push the playlist img url to the array
                                currTrack.playlists.push(playlistObjs[playlist].images[0]?.url);
                                tracksMap.set(track.id, currTrack);
                            } else {
                                let trackObj = {
                                    track: track,
                                    playlists: [playlistObjs[playlist].images[0]?.url]
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

                // check if the artist is in one of the saved albums
                savedAlbumTracks[album.id].forEach(track => {
                    track.artists.forEach(artist => {
                        if (artist.id === artistID) {
                            setUserKnowsArtist(true);
                            albumsMap.set(album.id, album);

                            if (savedTracksMap.has(track.id)) {
                                let currTrack = savedTracksMap.get(track.id);
                                // push the album img url to the array
                                currTrack.playlists.push(album.images[0]?.url);
                                savedTracksMap.set(track.id, currTrack);
                            } else {
                                let trackObj = {
                                    track: track,
                                    playlists: [album.images[0]?.url]
                                };
                                savedTracksMap.set(track.id, trackObj);
                            }
                        }
                    });
                });
            });

            let albumsToAdd = [];   
            albumsMap.forEach(album => {
                albumsToAdd.push(album);
            });
            setAlbumsArtistIsIn(albumsToAdd);
            playlistMap.forEach(playlist => {
                playlistsToAdd.push(playlistObjs[playlist]);
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

                    <UserArtistState artistName={artistInfo.name} userArtistState={isTopArtist? 0 : isTopArtistWithTrack? 1 : userKnowsArtist ? 2 : 3} topArtistIndex={topArtistIndex}/>

                    <Playlists playlists={playlistsArtistIsIn} type="playlist-item" />
                    <Playlists playlists={albumsArtistIsIn} type="saved-albums" />
                    {!userKnowsArtist ? <AddPlaylist artistInfo={artistInfo} /> : null}
                    {userKnowsArtist && tracksUserKnows.size > 0 ? <SongsYouKnow tracks={tracksUserKnows} type={"playlists-tracks"}/> : null}
                    {userKnowsArtist && savedTracksUserHas.size > 0 ? <SongsYouKnow tracks={savedTracksUserHas} type={"saved-tracks"} /> : null}
                    <Playlists playlists={similarArtists} type="similar-artists" />
                    <div style={{height: '40px'}}></div>
                </div>
            ) : <Loader string={"Finding out if you know them!!"}/> }
            <div className='action-button'>
                <button onClick={() => {
                    updateArtistID(null);
                    navigate('/')
                }}> New Search </button>
            </div>
            <img id="spotify-icon" src={require("../images/Spotify_Icon_RGB_White.png")} alt="Spotify Logo" style={{width: '40px'}}/>
        </div>
    );
}

export default Results;