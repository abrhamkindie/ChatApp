import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Base_Url } from '../../API';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const formData = { username, email, password };
      if (profilePictureFile) {
        // Validate file type and size (max 3MB)
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(profilePictureFile.type)) {
          throw new Error('Only JPG, PNG, or GIF files are allowed');
        }
        if (profilePictureFile.size > 3 * 1024 * 1024) {
          throw new Error('Image size must be less than 3MB');
        }
        const reader = new FileReader();
        reader.readAsDataURL(profilePictureFile);
        await new Promise((resolve, reject) => {
          reader.onload = () => {
             formData.profilePicture = reader.result;
            resolve();
          };
          reader.onerror = () => reject(new Error('Failed to read profile picture'));
        });
      }
    
      const res = await axios.post(`${Base_Url}/auth/register`, formData);
      console.log('Signup response:', res.data);  
      setError('');
      navigate('/login');
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setError(
        err.response?.status === 413
          ? 'Image too large. Please use an image smaller than 3MB.'
          : err.response?.data?.error || err.message || 'Registration failed'
      );
    }
  };

  return (
    <div className="min-h-screen bg-teal-500 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-teal-800 text-center mb-6">Sign Up for ChatApp</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label htmlFor="profilePicture" className="block text-teal-700 font-semibold mb-2">Profile Picture (Optional)</label>
            <input
              id="profilePicture"
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={(e) => setProfilePictureFile(e.target.files[0])}
              className="w-full text-teal-700"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="username" className="block text-teal-700 font-semibold mb-2">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-teal-300 rounded-lg text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-teal-700 font-semibold mb-2">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-teal-300 rounded-lg text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-teal-700 font-semibold mb-2">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-teal-300 rounded-lg text-teal-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-amber-500 text-teal-900 font-semibold rounded-lg hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-teal-700 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-500 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;