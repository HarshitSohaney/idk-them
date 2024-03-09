import React from'react';
import { useNavigate } from'react-router-dom';

function SearchSuggest({name, id, images}) {
    const navigate = useNavigate();
    const handleSuggestClick = () => {
        navigate(`/results/${id}`);
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