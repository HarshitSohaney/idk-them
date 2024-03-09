import React from'react';
import { useNavigate } from'react-router-dom';

function SearchSuggest({name, id, images}) {
    const navigate = useNavigate();
    return (
        <button onClick={() => {
            navigate(`/results/${id}`);
        }}>
            <img src={images[0].url} alt={name} />
            <p>{name}</p>
        </button>
    );
}

export default SearchSuggest;