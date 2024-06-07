import React from "react";
import "../css/about-artist.css";
function AboutArtist({artistInfo}) {
    const numOfFollowersInString = artistInfo.followers.total.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return (
        <div id="about-artist">
            <div id="artist-header-img">
                <img src={artistInfo.images[0]?.url} alt={artistInfo.name} />
            </div>
            <h1>{artistInfo.name}</h1>

            <div id="artist-info">
                <div id="artist-genres">
                    {artistInfo.genres.map(genre => {    
                        return <p key={genre}>{genre}</p>
                    })}
                </div>
                <div id="artist-followers">
                    <h3>{numOfFollowersInString} followers</h3>
                </div>
            </div>


        </div>
    );
}

export default AboutArtist;