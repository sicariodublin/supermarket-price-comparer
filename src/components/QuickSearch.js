import React, { useState } from 'react';

function QuickSearch({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Quick Search"
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default QuickSearch;
