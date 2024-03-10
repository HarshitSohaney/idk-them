import React from "react";

function Logout() {
    return (
        <div id="logout">
            <button onClick={() => {
                localStorage.removeItem("authToken");
                window.location.href = '/';
            }}>Logout</button>
        </div>
    );
}

export default Logout;