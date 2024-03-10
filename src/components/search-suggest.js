import React, { useContext } from'react';
import SearchContext from '../contexts/searchContext';
import { useNavigate } from'react-router-dom';
import "../css/search.css";

function SearchSuggest({name, id, images}) {
    const { artistID, updateArtistID } = useContext(SearchContext);

    const handleSuggestClick = () => {
        updateArtistID(id);
    }

    return (
        <div className="artist-suggestion">
        <button onClick={handleSuggestClick}>
            {   images.length > 0 ?
                <img src={images[0].url} alt={name} /> : null
            }
            <p>{name}</p>
        </button>
        </div>
    );
}

export default SearchSuggest;