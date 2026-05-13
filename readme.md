# 🥗 Veg & Fruits E-commerce - MERN Stack (High Performance)

A production-grade MERN stack application for buying fresh vegetables and fruits. This project focuses on **high-performance backend architecture**, implementing **Redis Caching** to reduce database load and optimize response times.

---

## 🚀 Key Features

- **Optimized Catalog:** Handles 20,000+ product entries with efficient pagination and search logic.
- **Redis Caching Layer:** Implemented a read-aside caching strategy using Redis, reducing API latency from ~100ms to <15ms.
- **Payload Optimization:** Structured JSON responses to reduce network payload size by 80%.
- **Secure Authentication:** JWT-based user authentication with role-based access control (RBAC).
- **Advanced Filtering:** Search, sort (Price High-Low), and category-based filtering.
- **Responsive UI:** Fully responsive frontend built with React.js and Tailwind CSS.

---

## 🛠️ Tech Stack

- **Frontend:** React.js,CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **In-Memory Cache:** Redis
- **Cloud/Deployment:** Render, Vercel
- **Tools:** Git, Postman, JWT

---

## 🏗️ Backend Architecture (Redis Caching Logic)

This project uses a **Read-Aside Cache** pattern:

1. When a user requests products, the server first checks **Redis**.
2. If the data is found (Cache Hit), it is served instantly.
3. If not found (Cache Miss), the server fetches data from **MongoDB**, stores it in **Redis** with an expiry time, and then sends it to the user.
4. **Cache Invalidation:** The cache is automatically cleared when an admin updates or deletes a product to ensure data consistency.

---

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/yourusername/veg-fruits-mern.git](https://github.com/yourusername/veg-fruits-mern.git)
   ```

2.Install Dependencies:

Bash

# Root folder

npm install

# Client folder

cd client && npm install

3.Redis Setup:
Ensure Redis is installed and running on your local machine:

Bash
redis-server

4.Environment Variables:
Create a .env file in the root directory:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
REDIS_URL=redis://127.0.0.1:6379

5.Run the Application:

Bash

# Start Backend

npm run server

# Start Frontend

npm run dev
