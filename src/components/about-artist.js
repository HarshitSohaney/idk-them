import React from "react";
import "../css/about-artist.css";
function AboutArtist({artistInfo}) {
    return (
        <div id="about-artist">
            <div id="artist-header-img">
            <img src={artistInfo.images[0].url} alt={artistInfo.name} />
            </div>
            <h1>{artistInfo.name}</h1>
            <p>{artistInfo.followers.total} followers</p>
            <p>{artistInfo.genres.join(', ')}</p>
            <p>{artistInfo.popularity} popularity</p>

        </div>
    );
}

export default AboutArtist;