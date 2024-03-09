import { React,useEffect,useState } from "react";

function Search({setSearchResults, spotifyAuthToken}) {
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if(searchTerm !== "") {
            fetch("https://api.spotify.com/v1/search?q=" + searchTerm + "&type=track&limit=10", {
                headers: {
                    Authorization: "Bearer " + spotifyAuthToken
                }
            })
           .then(response => response.json())
           .then(data => {
                setSearchResults(data.tracks.items);
                console.log(data);
            })
           .catch(err => console.error(err));
        }
    }, [searchTerm, spotifyAuthToken, setSearchResults]);

    return (
        <div>
            <h1>Search</h1>
            <input type="text" placeholder="Search for a song" onKeyDown={(e) => {
                if (e.key === "Enter") {
                    setSearchTerm(e.target.value);
                }
            }} />
        </div>
    );
}

export default Search;