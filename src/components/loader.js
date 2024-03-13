import React from "react";
import "../css/loader.css";

function Loader({string}) {
    return (
        <div id="loader-wrapper">       
            <h3>{string}</h3>
            <div class="loader">
            </div>
        </div>
    );
}

export default Loader;