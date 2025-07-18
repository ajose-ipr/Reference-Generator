import '../css/Home.css';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="home-container">
      <div className="dashboard-card">
        <h1 className="welcome-title">
          Welcome, <span className="user-highlight">{user?.username}</span>!
        </h1>
        
        <p className="welcome-message">
          You're now logged in to your account. 
        </p>
        
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}