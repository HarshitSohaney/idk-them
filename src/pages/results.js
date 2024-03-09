import { React } from'react';
import { useParams } from 'react-router-dom';

function Results() {
    const artistId = useParams().id;
    const spotifyAuthToken = localStorage.getItem("authToken");

    console.log(spotifyAuthToken);
    return (
        <div>
            <h1>Results</h1>
        </div>
    );
}

export default Results;