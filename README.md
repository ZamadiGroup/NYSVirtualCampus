# NYS Virtual Campus

A comprehensive digital learning platform for the National Youth Service (NYS) Kenya, built with modern web technologies.

## 🇰🇪 About

NYS Virtual Campus is a professional e-learning platform designed specifically for the National Youth Service Kenya. It provides a complete digital learning experience with role-based access for students, tutors, and administrators.

## ✨ Features

### 🎓 Student Features
- **Dashboard**: Overview of courses, assignments, and progress
- **Course Management**: Access to enrolled courses and materials
- **Assignment Tracking**: Submit and track assignments
- **Announcements**: Stay updated with campus news

### 👨‍🏫 Tutor Features
- **Course Management**: Create and manage courses
- **Student Management**: Track student progress and engagement
- **Assignment Management**: Create and grade assignments
- **Analytics**: Performance insights and reports

### 👨‍💼 Admin Features
- **User Management**: Manage students, tutors, and staff
- **System Analytics**: Comprehensive system reports
- **Course Administration**: Oversee all courses and content
- **Settings**: Configure system preferences

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS + Radix UI
- **Build Tool**: Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js
- **Styling**: Professional NYS Kenya color scheme

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NYS-Virtual-Campus.git
   cd NYS-Virtual-Campus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   # Frontend only
   npm run dev:frontend
   
   # Full stack
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📱 Demo

The application includes a demo mode where you can switch between different user roles:
- **Student View**: Experience the student dashboard and features
- **Tutor View**: Access tutor management tools
- **Admin View**: Explore administrative functions

## 🎨 Design

The application features a professional design with:
- **NYS Kenya Color Scheme**: Official green and yellow branding
- **Responsive Design**: Works on all devices
- **Modern UI**: Clean, professional interface
- **Accessibility**: WCAG compliant design

## 📁 Project Structure

```
NYSVirtualCampus/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   ├── lib/           # Utilities and configurations
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   └── utils/             # Server utilities
├── shared/                # Shared types and utilities
└── dist/                  # Production build output
```

## 🔧 Troubleshooting

### Port Already in Use Error (EADDRINUSE)

If you encounter an error saying "address already in use" on port 5000:

**Option 1: Stop the process using the port**

On Windows:
```bash
# Find the process using port 5000
netstat -ano | findstr :5000
# Kill the process (replace <PID> with the actual process ID)
taskkill /PID <PID> /F
```

On macOS/Linux:
```bash
# Find and kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

**Option 2: Use a different port**

Create a `.env` file in the project root:
```bash
PORT=3000
```

Or run the server with a different port using cross-env (works on all platforms):
```bash
# Cross-platform (recommended)
cross-env PORT=3000 npm run dev

# Alternative for Unix-based systems (macOS/Linux)
PORT=3000 npm run dev

# Alternative for Windows (Command Prompt)
set PORT=3000 & npm run dev

# Alternative for Windows (PowerShell)
$env:PORT=3000; npm run dev
```

### Database Connection Issues

If you have trouble connecting to the database:
1. Check your MongoDB connection string in the `.env` file
2. Ensure your IP address is whitelisted in MongoDB Atlas
3. Verify your database credentials are correct

## 🤝 Contributing

We welcome contributions to improve the NYS Virtual Campus platform. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏛️ About NYS Kenya

The National Youth Service (NYS) Kenya is a government institution established to provide training and development opportunities for Kenyan youth. This virtual campus extends their mission into the digital realm, making education more accessible and efficient.

## 📞 Support

For support and questions:
- Email: support@nysvirtualcampus.ke
- Documentation: [Project Wiki](https://github.com/yourusername/NYS-Virtual-Campus/wiki)

## 🙏 Acknowledgments

- National Youth Service Kenya for the opportunity
- The React and TypeScript communities
- All contributors and supporters

---

**Built with ❤️ for the youth of Kenya 🇰🇪**
