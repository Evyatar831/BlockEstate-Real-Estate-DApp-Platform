import React, { useState } from 'react';

const MenuPage = () => {
  const [hoveredButton, setHoveredButton] = useState(null);
  
  const handleNavigate = (path) => {
    // Use direct window location navigation to avoid routing issues
    window.location.href = path;
  };

  const handleLogout = () => {
    localStorage.removeItem('access');
    window.location.href = '/';
  };

  // Card components with animation and interaction
  const ActionCard = ({ icon, title, description, path, color }) => {
    const isHovered = hoveredButton === title;
    
    return (
      <div 
        className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 ${
          isHovered ? 'scale-105 shadow-xl' : ''
        }`}
        onMouseEnter={() => setHoveredButton(title)}
        onMouseLeave={() => setHoveredButton(null)}
        onClick={(e) => {
          e.preventDefault();
          handleNavigate(path);
        }}
      >
        <div className={`h-2 ${color}`}></div>
        <div className="p-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${color} bg-opacity-20`}>
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-gray-600 h-24 flex items-center">{description}</p>
          <button 
            className={`px-4 py-2 rounded-lg text-white transition-colors ${color} hover:opacity-90 w-full mt-6`}
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(path);
            }}
          >
            {title === "My Listings" ? 'Go Now →' : 'Explore'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-28 pb-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md mb-10 p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="py-4">
              <h1 className="text-3xl font-bold text-gray-800">BlockEstate Portal</h1>
              <p className="text-gray-600 mt-3 text-lg">Welcome to your real estate blockchain platform</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/profile';
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                My Profile
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7z" clipRule="evenodd" />
                  <path d="M4 8a1 1 0 011-1h4a1 1 0 110 2H5a1 1 0 01-1-1z" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
            }
            title="Buy Property"
            description="Browse available properties and make secure blockchain purchases"
            path="/buy-property"
            color="bg-blue-600"
          />
          
          <ActionCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            }
            title="Sell Property"
            description="List your properties on the blockchain with smart contracts"
            path="/sell-property"
            color="bg-green-600"
          />
          
          <ActionCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z" clipRule="evenodd" />
                <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
              </svg>
            }
            title="My Purchases"
            description="View and manage all properties you've purchased"
            path="/purchased-properties"
            color="bg-purple-600"
          />
          
          <ActionCard 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
              </svg>
            }
            title="My Listings"
            description="Manage your listed properties and track sales"
            path="/my-listed-properties"
            color="bg-amber-600"
          />
        </div>

        {/* Info Section */}
        <div className="mt-10 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold">BlockEstate Information</h2>
          </div>
          <p className="text-gray-600">
            Our platform uses blockchain technology to secure your real estate transactions. 
            All property transfers are recorded on the blockchain, providing immutable proof of ownership 
            and transparent transaction history.
          </p>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={() => handleNavigate('/about')}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Learn more about BlockEstate →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;