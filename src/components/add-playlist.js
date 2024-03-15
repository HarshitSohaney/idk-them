import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/add-playlist.css";
import "../css/songs-you-know.css";
import add from "../images/add.png";
import add_hover from "../images/add_hover.png";
import done from "../images/done.png";

function AddPlaylist({artistInfo}) {
    const navigate = useNavigate();
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userId = localStorage.getItem("userID");
    const [topTracks, setTopTracks] = useState([]);
    const [newPlaylistID, setNewPlaylistID] = useState(null);

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
            <h2>Add to your library</h2>
            <div id="add-playlist-info-section">
                <img src={artistInfo.images[0]?.url} alt={artistInfo.name} />

                <div id="add-playlist-playlist-name">
                    <h2> Now you know {artistInfo.name}</h2>
                    <button 
                        onClick={async () => {
                            // create this playlists for the user
                            let response = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${spotifyAuthToken}`
                                },
                                body: JSON.stringify({
                                    name: `Now you know ${artistInfo.name}`,
                                    description: `Songs you have to listen to get to know ${artistInfo.name}! Created by idk-them`
                                }),
                            });

                            if(response.status === 401) {
                                // if error occurs with bad access token, we need to redirect to login
                                navigate('/login');
                            }

                            let data = await response.json();

                            let playlistID = data.id;
                            setNewPlaylistID(playlistID);
                            // add the tracks to the playlist
                            response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}/tracks`, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${spotifyAuthToken}`
                                },
                                body: JSON.stringify({
                                    uris: topTracks.map(track => {
                                        return track.uri;
                                    })
                                })
                            });

                            data = await response.json();

                            if (response.status === 200) {
                                // change the button to a checkmark
                                document.querySelector("#add-playlist-playlist-name > button > img").src = done;
                            }
                            else {
                                alert("Error creating playlist :(");
                            }
                    }}> 
                    <img src={add} alt="Add" onMouseOver={() => {
                        let currSrc = document.querySelector("#add-playlist-playlist-name > button > img").src;
                        // Change src to add_hover.png)
                        if(currSrc !== done) {
                            document.querySelector("#add-playlist-playlist-name > button > img").src = add_hover;
                        }
                    }} onMouseLeave={() => {
                        let currSrc = document.querySelector("#add-playlist-playlist-name > button > img").src;
                        if(currSrc !== done) {
                            // Change src back to add.png
                            document.querySelector("#add-playlist-playlist-name > button > img").src = add;
                        }
                    }}/>
                     </button>
                </div>
            </div>
            <div className="songs-list-add">
                {topTracks.map(track => {
                    return (
                        <div className="song-item" key={track.id}>
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