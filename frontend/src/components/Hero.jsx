import { Link } from 'react-router-dom';

function Hero() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-500 to-teal-700 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="flex flex-col md:flex-row items-center max-w-6xl mx-auto">
        <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            ChatApp: Connect Instantly
          </h1>
          <p className="text-lg sm:text-xl text-teal-100 mb-6">
            Join friends, create groups, and enjoy real-time messaging with a sleek, secure platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-amber-500 text-teal-900 font-semibold rounded-lg shadow-md hover:bg-amber-400 hover:scale-105 transition-transform"
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 bg-white text-teal-500 font-semibold rounded-lg shadow-md hover:bg-gray-100 hover:scale-105 transition-transform"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-6 py-3 bg-teal-800 text-amber-500 font-semibold rounded-lg shadow-md hover:bg-teal-700 hover:scale-105 transition-transform"
            >
              Get Started to Chat
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <img
            src="   https://plus.unsplash.com/premium_photo-1719575633377-89d539244e95?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D    "
            alt="Chat Illustration"
            className="w-full max-w-sm rounded-lg shadow-lg"
          />
        </div>
      </div>
      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold text-white mb-4">Why Choose ChatApp?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <p className="text-teal-100">Real-Time Messaging</p>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p className="text-teal-100">Group Chats</p>
          </div>
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <p className="text-teal-100">Read Receipts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;