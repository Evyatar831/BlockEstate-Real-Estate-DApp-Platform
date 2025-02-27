# BlockEstate 🏢⛓️

<div align="center">
  
![BlockEstate](https://img.shields.io/badge/BlockEstate-Real%20Estate%20on%20Blockchain-blue?style=for-the-badge)

[![Smart Contract](https://img.shields.io/badge/Smart_Contract-Solidity-363636?style=flat-square&logo=solidity)](https://soliditylang.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![Backend](https://img.shields.io/badge/Backend-Django-092E20?style=flat-square&logo=django)](https://www.djangoproject.com/)
[![Styling](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

*A decentralized application for secure real estate transactions using blockchain technology*
</div>

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Usage Guide](#usage-guide)
- [Security Features](#security-features)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

BlockEstate revolutionizes real estate transactions by leveraging blockchain technology to create a transparent, secure, and efficient marketplace. The platform enables property listing, buying, selling, and ownership verification with complete transparency and reduced need for intermediaries.

## ✨ Features

- **User Authentication & Management**
  - Secure login and registration
  - Profile management
  - Password recovery system
  - Administrative dashboard

- **Property Management**
  - List properties with details, images, and documents
  - Browse available properties with search and filtering
  - Track owned and sold properties
  - View property transaction history

- **Blockchain Integration**
  - Smart contract-based transactions
  - MetaMask wallet connection
  - Automated payment processing
  - Platform fee management
  - Immutable ownership records

- **Security**
  - Input validation and sanitization
  - Protection against XSS and injection attacks
  - Secure password storage
  - Lockout mechanism for failed login attempts

## 📂 Project Structure

```
📦 BlockEstate
├── real-estate-contract/              # Smart contract implementation
│   ├── contracts/                     # Solidity smart contracts
│   │   └── RealEstateContract.sol     # Main smart contract
│   ├── scripts/                       # Deployment scripts
│   │   └── deploy.js                  # Contract deployment script
│   └── test/                          # Contract tests
│       └── RealEstateContractTest.js  # Contract test suite
│
└── WebSite/BlockEstate/               # Web application
    ├── backend/                       # Django backend
    │   ├── api/                       # API implementation
    │   │   ├── config.py              # Password configuration
    │   │   ├── models.py              # Data models
    │   │   ├── validators.py          # Input validation
    │   │   └── views.py               # API endpoints
    │   ├── core/                      # Core functionality
    │   │   ├── settings.py            # Django settings
    │   │   └── urls.py                # URL routing
    │   └── users/                     # User management
    │       ├── middleware.py          # Security middleware
    │       ├── models.py              # User models
    │       └── views.py               # User endpoints
    │
    └── frontend/                      # React frontend
        ├── public/                    # Static assets
        └── src/                       # Source code
            ├── components/            # React components
            │   ├── AboutPage.js       # About page
            │   ├── ForgotPassword.js  # Password recovery
            │   ├── LoginForm.js       # Authentication
            │   ├── MenuPage.js        # Main navigation
            │   ├── MyListedProperties.jsx # Property management
            │   ├── Navbar.js          # Navigation bar
            │   ├── PropertyListingsPage.jsx # Property browsing
            │   ├── PurchasedProperties.jsx # Owned properties
            │   ├── RegisterForm.js    # User registration
            │   ├── SellPropertyPage.jsx # Property listing
            │   └── UserProfile.js     # User settings
            │
            └── real-estate-package/   # Reusable components and utilities
                ├── components/ui/     # UI components
                ├── config/contract    # Contract configuration
                ├── services/          # Backend services
                │   ├── ipfsService.js  # IPFS integration
                │   └── storageService.js # Storage management
                └── utilsApp/          # Utilities
                    ├── errors.js      # Error handling
                    ├── security.js    # Security utilities
                    └── web3.js        # Blockchain integration
```

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Web3.js** - Ethereum integration
- **IPFS** - Decentralized storage for property documents

### Backend
- **Django** - REST API framework
- **JWT Authentication** - Secure user sessions
- **SQLite/PostgreSQL** - Database storage

### Blockchain
- **Solidity** - Smart contract development
- **Hardhat** - Ethereum development environment
- **MetaMask** - Wallet integration

## ⚙️ Installation

### Prerequisites
- Node.js (v14+)
- Python (3.8+)
- npm (v6.14.0+)
- MetaMask browser extension
- Git

## 🔗 Smart Contract Deployment

```bash
# Terminal A - Start local blockchain
cd real-estate-contract
npx hardhat node

# Terminal B - Deploy smart contract
cd real-estate-contract
npx hardhat run scripts/deploy.js --network localhost
```

## 🐍 Backend Setup

```bash
# Navigate to backend directory
cd WebSite/BlockEstate/backend

# Create and activate virtual environment
python -m venv env
source env/bin/activate  # Unix/macOS
# or
env\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "SECRET_KEY=your_generated_secret_key" > .env

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

## ⚛️ Frontend Setup

```bash
# Navigate to frontend directory
cd WebSite/BlockEstate/frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 📱 Usage Guide

1. **Registration/Login**: Create an account or log in with existing credentials
2. **Browse Properties**: View available real estate listings with filtering options
3. **Connect Wallet**: Link your MetaMask wallet to enable blockchain transactions
4. **List a Property**: Add property details, images, and set price in ETH
5. **Purchase Property**: Execute secure blockchain transactions with MetaMask
6. **Manage Portfolio**: Track your owned properties and listings in one dashboard

## 🔒 Security Features

BlockEstate implements multiple security measures:

- Comprehensive input validation and sanitization
- Protection against XSS and injection attacks
- Secure password policies with history checking
- Account lockout mechanism after failed login attempts
- JWT-based authentication with proper expiration
- Encrypted storage of sensitive data
- Secure blockchain transactions



## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <sub>Built with ❤️ by the BlockEstate Team</sub>
</div>
