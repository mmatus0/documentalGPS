import React from 'react';
import UserList from './components/UserList';
import './styles.css';

function App() {
  return (
    <div>
      <header className="app-header">
        <div className="brand">
          <div className="brand-mark">GD</div>
          <div>
            <div className="brand-name">DocumentalGPS</div>
            <div className="brand-sub">Sistema de Gestión Documental</div>
          </div>
        </div>
      </header>
      <div className="page-container">
        <UserList />
      </div>
    </div>
  );
}

export default App;