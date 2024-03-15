import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SongsYouKnow from "./songs-you-know";
import "../css/songs-you-know.css";
import "../css/add-playlist.css";

function AddPlaylist({artistInfo}) {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const [topTracks, setTopTracks] = useState([]);

    useEffect(() => {
        // We're gonna get the artist's top tracks
        const getTopTracks = async () => {
            const response = await fetch(`https://api.spotify.com/v1/artists/${artistInfo.id}/top-tracks?limit=10`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${spotifyAuthToken}`
                }
            });
            const data = await response.json();

            if (response.status === 401) {
                // if error occurs with bad access token, we need to redirect to login
                navigate('/login');
            }

            setTopTracks(data.tracks);
        }

        getTopTracks();
    }, []);


    return (
        <div className="add-playlist" id="songs-you-know">
            <div id="add-playlist-info-section">
                <img src={artistInfo.images[0]?.url} alt={artistInfo.name} />

                <div id="add-playlist-playlist-name">
                    <h2> Now you know {artistInfo.name}</h2>
                    <button onClick={() => {

                    }}> Add to Playlist </button>
                </div>
            </div>
            <div className="songs-list">
                {topTracks.map(track => {
                    return (
                        <div className="song-item" key={track.id} onClick={() => {
                            window.open(track.external_urls.spotify, "_blank");
                        }}>
                            <div className="item-info">
                                <h4>{track.name}</h4>
                                <p>{track.album.name}</p>
                            </div>
                            <div className="playlists">
                                <img src={track.album.images[0]?.url} alt="Album" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AddPlaylist;