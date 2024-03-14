import React from "react";
import know_them_well from "../images/know_them_well.png";
import you_dont_know from "../images/you_dont_know.png";
import you_know_them from "../images/you_know_them.png";
import "../css/user-artist-state.css"

function UserArtistState({userArtistState}) {
    console.log(userArtistState);
    const states = ["You love them! They're all over your library", "You know this artist, they appear in some of your playlists!", "You don't know this artist... yet :) Let's change that"];

    return (
        <div id="user-artist-state">
            <img src={userArtistState === 0 ? know_them_well : userArtistState === 2 ? you_dont_know : you_know_them} alt="State" />
            <h3>{states[userArtistState]}</h3>
        </div>
    );
}

export default UserArtistState;