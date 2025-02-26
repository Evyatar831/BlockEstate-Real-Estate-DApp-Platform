# BlockEstate Project

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (3.8+)

-npm (v6.14.0 or later)
-Hardhat (v2.19.0 or later)
-MetaMask browser extension


### Frontend Setup
```bash



### TERMINAL A- TO run the web site
cd website\BlockEstate\frontend
npm run start
############################

### TERMINAL B- TO run the Server
cd WebSite/BlockEstate/backend
env\Scripts\activate
python manage.py runserver

############################

### TERMINAL C- TO deploy test blockchain
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat node
############################

### TERMINAL D- TO deploy -RealEstateContract
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat run scripts/deploy.js --network localhost
############################





# Install dependencies
npm install
# Start development server
npm start
```

### Backend Setup
```bash
# Navigate to backend directory
cd website\BlockEstate\backend

# Create virtual environment
python -m venv env

# Activate virtual environment
# Windows:
env\Scripts\activate
# Unix/macOS:
source env/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Create .env file at the backend folder and copy inside
```
SECRET_KEY=
```

### Generate a new Django secret key
Write in the terminal:
```
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```
Copy the output to "SECRET_KEY"

# Run migrations
```
python manage.py makemigrations api
python manage.py makemigrations
python manage.py migrate
```

### Create a superuser (admin):
```
python manage.py createsuperuser
```
Follow the prompts to set the username, email, and password.


### Start the development server:
```
python manage.py runserver
```

### Features
- User authentication (login/register)
- Password reset functionality
- Subscription management
- Admin dashboard
- User profile management

### API Endpoints
- `/api/login/` - User login
- `/api/register/` - User registration
- `/api/forgot-password/` - Password reset
- `/api/user/` - User information
- `/api/users/` - User management (admin)
- `/api/user/subscriptions/` - Subscription management


### Common Issues
1. Database migration errors:
```bash
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

2. Node modules issues:
```bash
rm -rf node_modules
npm install
```

3. Port conflicts:
- Frontend runs on port 3000
- Backend runs on port 8000




### DEPLOYMENT  for  Smart Contract!


### Prerequisites
### Before beginning the deployment process, ensure you have the following installed:

Node.js (v14.0.0 or later)
npm (v6.14.0 or later)
Hardhat (v2.19.0 or later)
MetaMask browser extension

### The main contract file is located at contracts/RealEstateContract.sol




### Environment Setup
### First, navigate to the smart contract directory and install the required dependencies:
cd real-estate-contract
npm install



### TERMINAL A- deploy test blockchain
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat node


### TERMINAL B-  deploy -RealEstateContract
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract"
npx hardhat run scripts/deploy.js --network localhost

###  FRONTEND-   run real estate app only
cd "C:\Users\evyatar\Documents\Smart contract\real-estate-contract\frontend"
npm run dev