# Network Access Instructions

## Accessing the Task Manager from Other Devices

The Personal Task Manager is now configured to be accessible from other laptops/devices on the same WiFi network. **Each user can create their own account or use the demo account.**

### Access URLs

**Frontend (Web Interface):**
- http://172.17.81.98:5179

**Backend API:**
- http://172.17.81.98:3001

### For Other Users:

1. **Make sure you're on the same WiFi network** as the host computer
2. **Open a web browser** on your device
3. **Navigate to:** http://172.17.81.98:5179
4. **Choose one of these options:**

#### Option 1: Create Your Own Account
- Click "Don't have an account? Create one"
- Fill in your name, email, and password (6+ characters)
- Click "Create Account"
- You'll be automatically logged in

#### Option 2: Use Demo Account
- Click "Try Demo Account" or enter manually:
  - Email: `demo@example.com`
  - Password: `demo123`

### Features Available:

- ✅ **User Registration & Login** - Each user has their own account
- ✅ **Personal Data Isolation** - Each user sees only their own tasks
- ✅ **Individual Settings** - Theme and language preferences per user
- ✅ Full task management functionality
- ✅ Dark/Light theme switching
- ✅ Language switching (English/Chinese)
- ✅ Categories and priority management
- ✅ Due date tracking
- ✅ Real-time updates
- ✅ Logout functionality

### User Management:

- **Individual Accounts:** Each user can create their own account with email/password
- **Data Separation:** Tasks, categories, and settings are isolated per user
- **Persistent Login:** Stay logged in until you manually logout
- **Demo Access:** Shared demo account available for testing

### Technical Details:

- **Frontend:** React + Vite development server
- **Backend:** Node.js + Express API with JWT authentication
- **Database:** SQLite with user isolation
- **Authentication:** JWT-based with secure password hashing

### Troubleshooting:

1. **Can't access the website?**
   - Verify you're on the same WiFi network
   - Check if host computer firewall is blocking the ports
   - Try refreshing the page

2. **Registration/Login issues?**
   - Make sure email is valid format
   - Password must be at least 6 characters
   - Try the demo account if registration fails

3. **API errors?**
   - Backend runs on port 3001
   - Check network connectivity to 172.17.81.98:3001

4. **Can't see tasks?**
   - Each user only sees their own tasks
   - Make sure you're logged into the correct account

### Host Computer Requirements:

- Keep both frontend and backend servers running
- Ensure ports 5179 (frontend) and 3001 (backend) are accessible
- Maintain WiFi connection

### Security Notes:

- Each user has isolated data access
- Passwords are securely hashed
- JWT tokens expire after 30 days
- This is a development setup - for production use, implement HTTPS and additional security measures

---

**Getting Started:** Just navigate to http://172.17.81.98:5179 and either create your account or use the demo login!