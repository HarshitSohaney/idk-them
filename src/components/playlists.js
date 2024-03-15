import React, { useEffect } from "react";
import "../css/about-artist.css";

function Playlists({playlists, type}) { 
    useEffect(() => {
        // Change styling if we are displaying similar artists
        if (type === "similar-artists") {
            // make all playlist items circular image
            const playlistItems = document.querySelectorAll("#similar-artists > img");
            playlistItems.forEach(item => {
                item.style.borderRadius = "50%";
            });
        }
    }
    , []);

    return (
        <div id="your-playlists">
            {playlists.length === 0 ? null : 
                 type === "playlist-item" ? <h2>Your Playlist Appearances</h2> : type === "similar-artists" ? <h2>Similar Artists</h2> : type ==="saved-albums" ? <h2>Saved Albums</h2> : null}
            <div id="playlist-list">
                {playlists.map(playlist => {
                    return (
                        <div className="playlist-item" id={type} key={playlist.id} onClick={() => {
                            window.open(playlist.external_urls.spotify, "_blank");
                        }}>
                            <img src={playlist.images[0]?.url} alt={playlist.name} />
                            <h4>{playlist.name}</h4>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Playlists;