# BlockEstate Project

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- Python (3.8+)

### Frontend Setup
```bash
# Navigate to frontend directory
cd website\BlockEstate\frontend
npm run
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

