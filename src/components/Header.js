import React from 'react';

function Header() {
  return (
    <header>
      <nav>
        <h1>Supermarket Price Comparer</h1>
        <form method="get" action="/search">
          <input type="text" placeholder="Quick Search" name="query" />
          <button type="submit">Search</button>
        </form>
      </nav>
    </header>
  );
}

export default Header;
