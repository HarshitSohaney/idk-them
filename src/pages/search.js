import { React,useEffect,useState } from "react";
import SearchSuggest from "../components/search-suggest";

function Search({spotifyAuthToken}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
        if(searchTerm !== "" && searchTerm.length > 2 && spotifyAuthToken !== null) {
            // We are going to search a user's library and recent listening history to see if they know a band
            // We are going to use the Spotify API to search for a track with the name of the band

            // get artist ID based on band name
            const artistURL = `https://api.spotify.com/v1/search?q=${searchTerm}&type=artist&limit=5`;
            fetch(artistURL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${spotifyAuthToken}`
                }
            })
            .then(response => {
                if(response.status === 200) {
                    // We have an access token, so we can now get the user's profile
                    response.json().then(data => {
                        console.log('data', data);
                        setSearchResults(data.artists.items);
                    });
                    
                } else {
                    // Artist was not found
                    // let the user know that 
                    alert("Artist not found");
                }
            }
            )
            .catch(error => {
                console.error('Error:', error);
                return null;
            });    
        }
    }, [searchTerm, spotifyAuthToken, setSearchResults]);

    return (
        <div>
            <h1>Search</h1>
            <input type="text" placeholder="Search for a song" onChange={(event) => {
                setSearchTerm(event.target.value);
            }} />
            {/* dropdown of artists created as user searches */}
            <table id="suggestions-table">
                <thead>
                    <tr>
                        <th>Artist</th>
                    </tr>
                </thead>
                <tbody>
                    {searchResults? searchResults.map((artist) => {
                        return (
                            <SearchSuggest key={artist.id} name={artist.name} images={artist.images} id={artist.id}/>
                        );
                    }) : null}
                </tbody>
            </table>


        </div>
    );
}

export default Search;