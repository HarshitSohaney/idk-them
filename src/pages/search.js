import { React,useEffect,useState, useContext } from "react";
import SearchSuggest from "../components/search-suggest";
import UserContext from "../contexts/userContext";

function Search({spotifyAuthToken}) {
    const userInfo = useContext(UserContext);

    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    useEffect(() => {
         // lets get all the user's info right now itself
         fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            response.json().then(data => {
                userInfo.updateUserID(data.id);
                userInfo.updateUserName(data.display_name);
            }
            );
        });

        // lets get all the user's playlists
        fetch(`https://api.spotify.com/v1/users/${userInfo.userID}/playlists`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            response.json().then(data => {
                userInfo.updateUserPlaylists(data.items);
            });
        }
        );

        // lets get the user's top tracks
        fetch(`https://api.spotify.com/v1/me/top/tracks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            response.json().then(data => {
                userInfo.updateUserTopTracks(data.items);
            });
        });

        // lets get the user's saved tracks
        fetch(`https://api.spotify.com/v1/me/tracks`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${spotifyAuthToken}`
            }
        }).then(response => {
            response.json().then(data => {
                userInfo.updateSavedTracks(data.items);
            });
        });

    }, [spotifyAuthToken]);

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
            <h1>Who are you looking for {userInfo.userName}?</h1>
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