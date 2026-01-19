# HealthHive

## Prerequisites
- Node.js installed
- MongoDB Atlas Connection String (set in `.env`)

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    cd client
    npm install
    cd ..
    ```

2.  **Environment Variables**:
    Ensure you have a `.env` file in the root directory with:
    ```env
    PORT=3000
    JWT_SECRET="your-secret-key"
    MONGODB_URI=mongodb+srv://<username>:<password>@cluster...
    ```

## How to Run

You need to run the **Backend** and **Frontend** in two separate terminals.

### 1. Start the Backend
From the root directory (`Healthhive`):
```bash
# Build the project (if you haven't recently)
npm run build

# Start the server
node dist/server.js
```
*The backend will run on http://localhost:3000*

### 2. Start the Frontend
Open a new terminal, navigate to the `client` folder, and start the dev server:
```bash
cd client
npm run dev
```
*The frontend will run on http://localhost:5173* (or similar)

## Accessing the App
Open your browser and go to: [http://localhost:5173](http://localhost:5173)
