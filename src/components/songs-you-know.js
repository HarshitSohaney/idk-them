import React, { useEffect, useState } from "react";

function SongsYouKnow({tracks}) {
    return (
        <div id="songs-you-know">
            <h3>Songs you know of</h3>
            <div className="songs-list">
                {tracks.map((track, index) => {
                    return (
                        <div className="song-item" key={index}>
                            <img src={track.playlistImg} alt={track.name} />
                            <h4>{track.name}</h4>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default SongsYouKnow;