import React from "react";
import know_them_well from "../images/know_them_well.png";
import you_dont_know from "../images/you_dont_know.png";
import you_know_them from "../images/you_know_them.png";
import "../css/user-artist-state.css"

function UserArtistState({artistName, userArtistState, topArtistIndex}) {
    const states = [`${artistName} is one of your top artists! They're ranked ${topArtistIndex+1} of all time 👀. The rest of this page just shows how much you love them`, `Your top tracks have ${artistName} all over them! You love listening to their music`, "You know this artist, they appear in some of your playlists or in your library!", "You don't know this artist... yet :) Let's change that"];
    return (
        <div id="user-artist-state">
            <img src={userArtistState === 0 || userArtistState === 1 ? know_them_well : ( userArtistState === 2 ? you_know_them : you_dont_know)} alt="State" />
            <h3>{states[userArtistState]}</h3>
        </div>
    );
}

export default UserArtistState;