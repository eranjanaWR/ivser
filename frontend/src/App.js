import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    try {
      const res = await axios.post('http://localhost:5000/signup', formData);
      alert(res.data);
    } catch (err) {
      alert("Error during signup! Make sure backend is running.");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5000/login', formData);
      alert(res.data);
    } catch (err) {
      alert("Invalid Credentials or Connection Error!");
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'Arial' }}>
      <h1>Team Shared Database Test</h1>
      <div style={{ border: '1px solid #ccc', padding: '30px', display: 'inline-block', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <input name="username" placeholder="Username" onChange={handleChange} style={{ padding: '10px', marginBottom: '10px', width: '200px' }} /><br/>
        <input name="password" type="password" placeholder="Password" onChange={handleChange} style={{ padding: '10px', marginBottom: '20px', width: '200px' }} /><br/>
        <button onClick={handleSignup} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Register to Cloud DB</button>
        <button onClick={handleLogin} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', marginLeft: '10px', cursor: 'pointer' }}>Login Test</button>
      </div>
      <p style={{ marginTop: '20px', color: '#666' }}>After registering, tell your teammates to pull the code and try logging in!</p>
    </div>
  );
}

export default App;
