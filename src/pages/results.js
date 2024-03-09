import { React, useEffect, useContext } from'react';
import { useParams } from 'react-router-dom';
import UserContext from '../contexts/userContext';

function Results() {
    const artistId = useParams().id;
    const spotifyAuthToken = localStorage.getItem("authToken");
    const userInfo = useContext(UserContext);

    useEffect(() => {
        console.log(userInfo);
    }, []);
    
    return (
        <div>
            <h1>YOU KNOW THESE GUYS! </h1>
        </div>
    );
}

export default Results;