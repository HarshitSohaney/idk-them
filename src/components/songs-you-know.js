import React, { useEffect, useState } from "react";
import play_button from "../images/play_button.png";
import "../css/songs-you-know.css";

function SongsYouKnow({tracks, type}) {
    // sort the tracks by the number of playlists they appear in

    tracks = new Map([...tracks].sort((a, b) => {
        return b[1].playlists.length - a[1].playlists.length;
    }));

    return (
        <div id="songs-you-know">
            {type === "playlists-tracks" ? <h2>Songs in your playlists</h2> : type === "saved-tracks" ? <h2>Songs in your liked</h2> : null}
            <div className="songs-list" id={type}>
                {Array.from(tracks).map(track => {
                    return (
                        <div className="song-item" key={track[1].track.id} onClick={() => {
                            window.open(track[1].track.trackURL, "_blank");
                        }}>
                            <div className="item-info">
                                <h4>{track[1].track.name}</h4>
                                <p>{track[1].track.album.name}</p>
                            </div>
                            <div className="playlists">
                                {track[1].playlists.map(playlist => {
                                    return (
                                        <img src={playlist} alt="Playlist" />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SongsYouKnow;