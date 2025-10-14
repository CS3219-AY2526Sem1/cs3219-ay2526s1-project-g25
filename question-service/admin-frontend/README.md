# Question Service Admin Panel

A beautiful, modern admin panel for managing coding questions.

## Features

✨ **Modern UI** - Clean, gradient-based design with smooth animations
🔐 **Secure Authentication** - Admin-only JWT-based authentication
➕ **Create Questions** - Add new questions with images
✏️ **Edit Questions** - Update existing questions
🗑️ **Delete Questions** - Remove questions with confirmation
📸 **Image Upload** - Cloudinary integration for question images
📊 **Statistics Dashboard** - View question counts by difficulty
🔍 **Filtering** - Filter questions by difficulty and topic
📱 **Responsive** - Works on desktop, tablet, and mobile

## Setup

### 1. Install Dependencies

```bash
cd question-service/admin-frontend
npm install
```

### 2. Configure Environment

Create `.env` file:
```bash
REACT_APP_USER_SERVICE_URL=http://localhost:3001
REACT_APP_QUESTION_SERVICE_URL=http://localhost:4000
```

### 3. Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`

## Usage

### 1. Login

- Use your admin credentials (email/username + password)
- Only users with admin role can access the panel

### 2. View Dashboard

- See statistics: total questions, easy/medium/hard counts
- View all questions in a card layout
- Filter by difficulty or topic

### 3. Create Question

- Fill in title, description, difficulty, topic
- Optionally upload an image (max 5MB)
- Add test cases in JSON format
- Click "Create Question"

### 4. Edit Question

- Click "Edit" button on any question card
- Form will populate with existing data
- Update fields as needed
- Click "Update Question"

### 5. Delete Question

- Click "Delete" button on any question card
- Confirm deletion
- Question removed from database

## Image Upload Flow

1. Select image file (JPEG/PNG, max 5MB)
2. Image preview shows immediately
3. On submit, image uploads to Cloudinary
4. Image URL embedded in question description
5. Images display in question list

## Tech Stack

- **React** - UI library
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Markdown** - Markdown rendering
- **Cloudinary** - Image hosting

## Screenshots

### Login Page
![Login](docs/login.png)

### Dashboard
![Dashboard](docs/dashboard.png)

### Question Form
![Form](docs/form.png)

### Question List
![List](docs/list.png)

## Building for Production

```bash
npm run build
```

Builds optimized production files to `build/` folder.

## Deployment

Deploy the `build/` folder to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3

Make sure to set environment variables in your hosting platform.

## Troubleshooting

### CORS Errors
- Ensure backend services allow requests from frontend URL
- Check CORS configuration in user-service and question-service

### Authentication Fails
- Verify JWT_ACCESS_TOKEN_SECRET matches between services
- Check user has admin role in database
- Ensure token hasn't expired (15-minute lifetime)

### Image Upload Fails
- Verify Cloudinary credentials in backend `.env`
- Check image size (max 5MB)
- Ensure admin token is valid

## Support

For issues or questions, please check the main project documentation.




