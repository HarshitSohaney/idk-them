import React from "react";

function Logout() {
    return (
        <div className="action-button">
            <button onClick={() => {
                localStorage.removeItem("authToken");
                window.location.href = '/';
            }}>Logout</button>
        </div>
    );
}

export default Logout;