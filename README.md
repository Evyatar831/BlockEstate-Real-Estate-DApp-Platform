# BlockEstate - Real Estate DApp Platform

BlockEstate is a decentralized real estate platform that combines blockchain technology with traditional real estate transactions. The project consists of three main components: a smart contract backend for property transactions, a React-based frontend application, and a Django backend server for user management.

## Project Structure

```
📦 BlockEstate
├── real-estate-contract/       # Smart contract implementation
│   ├── contracts/             # Solidity smart contracts
│   ├── frontend/              # Contract-specific frontend
│   ├── scripts/               # Deployment scripts
│   └── test/                  # Contract tests
│
└── WebSite/BlockEstate/       # Main web application
    ├── backend/               # Django backend server
    │   ├── api/              # REST API implementation
    │   ├── core/             # Core functionality
    │   ├── users/            # User management
    │   └── env/              # Virtual environment
    │
    └── frontend/             # React frontend application
        ├── public/           # Static files
        ├── src/              # Source code
        │   ├── components/   # React components
        │   └── real-estate-package/  # Real estate specific components
        └── build/            # Production build
```

## Prerequisites

- Node.js (v14+)
- Python (3.8+)
- npm (v6.14.0 or later)
- Hardhat (v2.19.0 or later)
- MetaMask browser extension
- Git

## Installation and Setup

### 1. Smart Contract Deployment

```bash
# Terminal A - Start local blockchain
cd real-estate-contract
npx hardhat node

# Terminal B - Deploy smart contract
cd real-estate-contract
npx hardhat run scripts/deploy.js --network localhost
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd WebSite/BlockEstate/backend

# Create and activate virtual environment
python -m venv env

# Windows
env\Scripts\activate
# Unix/macOS
source env/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=your_generated_secret_key" > .env

# Generate Django secret key
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Run migrations
python manage.py makemigrations api
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd WebSite/BlockEstate/frontend

# Install dependencies
npm install

# Start development server
npm start
```

## Running the Application

You'll need four terminal windows to run all components:

1. Terminal A: Local Blockchain
```bash
cd real-estate-contract
npx hardhat node
```

2. Terminal B: Smart Contract Deployment
```bash
cd real-estate-contract
npx hardhat run scripts/deploy.js --network localhost
```

3. Terminal C: Backend Server
```bash
cd WebSite/BlockEstate/backend
env\Scripts\activate  # Windows
python manage.py runserver
```

4. Terminal D: Frontend Application
```bash
cd WebSite/BlockEstate/frontend
npm start
```

## Features

### Smart Contract
- Property listing and management
- Secure property transactions
- Ownership verification
- Transaction history

### Web Application
- User authentication (login/register)
- Password reset functionality
- Subscription management
- Admin dashboard
- User profile management
- Property listing interface
- Real-time transaction updates

## API Endpoints

- `/api/login/` - User authentication
- `/api/register/` - New user registration
- `/api/forgot-password/` - Password reset
- `/api/user/` - User information
- `/api/users/` - User management (admin only)
- `/api/user/subscriptions/` - Subscription management

## Default Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Hardhat Network: http://localhost:8545

## Troubleshooting

### Database Issues
```bash
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

### Node Module Issues
```bash
rm -rf node_modules
npm install
```

### MetaMask Connection
1. Ensure MetaMask is connected to Hardhat Network (localhost:8545)
2. Import a test account using private keys from Hardhat node
3. Switch to the imported account

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
