import React, { useContext } from'react';
import SearchContext from '../contexts/searchContext';
import { useNavigate } from'react-router-dom';

function SearchSuggest({name, id, images}) {
    const navigate = useNavigate();
    const { artistID, updateArtistID } = useContext(SearchContext);

    const handleSuggestClick = () => {
        updateArtistID(id);
    }

    return (
        <button onClick={handleSuggestClick}>
            {   images.length > 0 ?
                <img src={images[0].url} alt={name} /> : null
            }   
            <p>{name}</p>
        </button>
    );
}

export default SearchSuggest;