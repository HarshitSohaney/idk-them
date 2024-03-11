import React from "react";
import know_them_well from "../images/know_them_well.png";
import you_dont_know from "../images/you_dont_know.png";
import you_know_them from "../images/you_know_them.png";
import "../css/user-artist-state.css"

function UserArtistState({userArtistState}) {
    const images = [know_them_well];
    const states = ["You know this artist well", "You know this artist", "You don't know this artist"];

    return (
        <div id="user-artist-state">
            <img src={userArtistState === 0 ? know_them_well : userArtistState === 2 ? you_dont_know : you_know_them} alt="State" />
            <h3>{states[userArtistState]}</h3>
        </div>
    );
}

export default UserArtistState;