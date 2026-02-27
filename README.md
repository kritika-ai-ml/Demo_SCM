# Society Complaint Management System

A modern, full-stack web application for managing society complaints with role-based access control, file uploads, and real-time tracking.

## 🚀 Features

### For Residents
- 📝 Submit complaints with detailed descriptions
- 📎 Attach images and PDF files (up to 5MB)
- 📊 Track complaint status in real-time
- 💬 Add comments and communicate with admins
- 🔍 Filter and search your complaints

### For Administrators
- 👥 View all complaints from all residents
- ✏️ Update complaint status and priority
- 🎯 Assign complaints to specific handlers
- 💬 Add admin comments
- 📈 View dashboard statistics
- 🗑️ Delete inappropriate complaints

### Technical Features
- 🔐 JWT-based authentication
- 🛡️ Role-based access control (Resident/Admin)
- 📦 File upload with validation
- 🎨 Modern dark theme UI with glassmorphism
- 📱 Fully responsive design
- ⚡ Real-time filtering and search

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)

## 🔧 Installation

### 1. Clone or Navigate to Project Directory

```bash
cd Demo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MongoDB

**Option A: Local MongoDB**
1. Install MongoDB on your system
2. Start MongoDB service:
   - Windows: MongoDB should auto-start, or run `mongod` in terminal
   - Mac: `brew services start mongodb-community`
   - Linux: `sudo systemctl start mongodb`

**Option B: MongoDB Atlas (Cloud)**
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and get your connection string
3. Update `.env` file with your connection string

### 4. Configure Environment Variables

The `.env` file is already created with default values:

```env
MONGODB_URI=mongodb://localhost:27017/society-complaints
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
PORT=3000
NODE_ENV=development
```

**Important**: Change the `JWT_SECRET` to a random string (minimum 32 characters) in production.

## 🎯 Running the Application

### Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

### Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 👥 Getting Started

### Create Your First Account

1. Click **"Get Started"** or **"Sign In"** on the landing page
2. Switch to the **"Register"** tab
3. Fill in your details:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Select Role: **Resident** or **Admin**
   - Optional: Flat Number and Phone Number
4. Click **"Create Account"**

### Test the Application

**As a Resident:**
1. Register with role "Resident"
2. Submit a new complaint with title, description, category, and optionally attach images
3. View your complaints dashboard
4. Track status updates
5. Add comments

**As an Admin:**
1. Register with role "Admin"
2. View all complaints from all residents
3. Update complaint status (Pending → In Progress → Resolved)
4. Assign complaints to handlers
5. Add admin comments
6. View statistics

## 📁 Project Structure

```
Demo/
├── models/               # Database models
│   ├── User.js          # User schema
│   └── Complaint.js     # Complaint schema
├── routes/              # API routes
│   ├── auth.js          # Authentication endpoints
│   └── complaints.js    # Complaint endpoints
├── middleware/          # Express middleware
│   ├── auth.js          # JWT authentication
│   └── upload.js        # File upload (multer)
├── public/              # Frontend files
│   ├── index.html       # Landing page
│   ├── auth.html        # Login/Register page
│   ├── resident-dashboard.html
│   ├── admin-dashboard.html
│   ├── css/
│   │   └── styles.css   # Design system
│   └── js/
│       ├── api.js       # API utilities
│       ├── auth.js      # Auth logic
│       ├── resident.js  # Resident dashboard
│       └── admin.js     # Admin dashboard
├── uploads/             # Uploaded files (auto-created)
├── server.js            # Express server
├── package.json         # Dependencies
└── .env                 # Environment variables
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ File type validation (images and PDFs only)
- ✅ File size limits (5MB maximum)
- ✅ XSS protection with input sanitization

## 🎨 Complaint Categories

- 🔧 Maintenance
- 🛡️ Security
- 🔇 Noise Complaints
- 🚗 Parking Issues
- 🧹 Cleanliness
- 💧 Water Supply
- ⚡ Electricity
- 🏗️ Lift/Elevator
- 🏢 Common Areas
- 📌 Others

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Complaints
- `POST /api/complaints` - Create complaint (resident)
- `GET /api/complaints` - Get complaints (filtered by role)
- `GET /api/complaints/:id` - Get single complaint
- `PUT /api/complaints/:id` - Update complaint (admin)
- `POST /api/complaints/:id/comments` - Add comment
- `DELETE /api/complaints/:id` - Delete complaint (admin)
- `GET /api/complaints/stats/overview` - Get statistics (admin)

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check MongoDB service
- Verify connection string in `.env`
- For Windows, ensure MongoDB service is started

### Port Already in Use
- Change `PORT` in `.env` to a different port (e.g., 3001)
- Or stop the process using port 3000

### File Upload Not Working
- Check that `uploads/` directory exists (auto-created by middleware)
- Verify file size is under 5MB
- Ensure file type is image (JPG, PNG, GIF) or PDF

### Dependencies Installation Failed
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again
- Ensure you have Node.js v14 or higher

## 🔄 Future Enhancements

- 📧 Email notifications
- 🔔 Real-time updates with WebSockets
- 📈 Advanced analytics dashboard
- 📱 Mobile app (React Native)
- 🌐 Multiple language support
- 📄 Export complaints to PDF/Excel

## 📝 License

MIT License - feel free to use this project for your society!

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify all prerequisites are installed
3. Ensure MongoDB is running

---

**Built with ❤️ for efficient society management**
