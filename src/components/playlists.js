import React from "react";
import "../css/about-artist.css";

function Playlists({playlists}) {
    console.log("PLAYLISTS ARTIST IS IN", playlists);
    return (
        <div id="your-playlists">
            <h2>Your Playlist Appearances</h2>
            <div id="playlist-list">
                {playlists.map(playlist => {
                    return (
                        <div className="playlist-item" key={playlist.id}>
                            <img src={playlist.images[0].url} alt={playlist.name} />
                            <h3>{playlist.name}</h3>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Playlists;