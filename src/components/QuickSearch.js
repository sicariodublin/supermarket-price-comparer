import { useState } from 'react';
import { useHistory } from 'react-router-dom';

function QuickSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  

  const handleSearch = async (e) => {
    /* const handleSearch = (e) => { */
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to SearchPage with the search term as a query parameter
      history.push(`/search?term=${encodeURIComponent(searchTerm)}`);
    } else {
      history.push('/search');
    }
  };

  return (
    <form onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Quick Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  );
}

export default QuickSearch;
