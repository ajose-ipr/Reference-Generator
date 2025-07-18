import '../css/Register.css';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    console.log('[Register] Form submitted with values:', { username, password });
    
    try {
      console.log('[Register] Attempting to call register function');
      await register(username, password);
      console.log('[Register] Registration successful, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('[Register] Registration error:', err);
      setError('Failed to register: ' + (err.message || 'Unknown error'));
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2 className="register-title">Create Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input 
            id="username"
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            id="password"
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <div className="password-strength">
            <div 
              className="password-strength-fill" 
              style={{ width: `${Math.min(password.length * 10, 100)}%` }}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input 
            id="confirmPassword"
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
          {password && confirmPassword && (
            <div className={`password-match ${password === confirmPassword ? 'match' : 'no-match'}`}>
              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          className="register-button"
          disabled={password && confirmPassword && password !== confirmPassword}
        >
          Register
        </button>
        
        <div className="login-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </div>
  );
}