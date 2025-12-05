# MicroLearn AI Backend

This folder contains the complete backend source code for the MicroLearn AI application. It's a Node.js server built with Express, TypeScript, and Prisma ORM for database management.

## Features

-   **Authentication:** Secure user registration and login using JWT.
-   **Content Management:** Full CRUD APIs for topics and their content.
-   **Permissions:** Role-based access control for content visibility.
-   **Progress Tracking:** Endpoints to track user learning progress.
-   **AI Proxy:** Securely proxies requests to the Gemini API, keeping the API key safe on the server.

## Tech Stack

-   **Framework:** Express.js
-   **Language:** TypeScript
-   **Database ORM:** Prisma
-   **Database:** PostgreSQL (recommended)
-   **Authentication:** JSON Web Tokens (JWT)

---

## Setup and Installation

### Prerequisites

1.  **Node.js:** v18 or later.
2.  **NPM or Yarn:** Package manager.
3.  **PostgreSQL:** A running PostgreSQL database instance. You can run one locally using Docker.
    ```bash
    docker run --name microlearn-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
    ```

### Step-by-Step Guide

1.  **Install Dependencies:**
    Navigate into the `backend` directory and install the required npm packages.
    ```bash
    cd backend
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the `backend` directory by copying the example file.
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in your actual database connection string, JWT secret, and Gemini API key.

3.  **Run Database Migrations:**
    Prisma will read your `schema.prisma` file and create the necessary tables in your database.
    ```bash
    npx prisma migrate dev --name init
    ```
    This will also generate the Prisma Client based on your schema.

4.  **Seed the Database (Optional but Recommended):**
    To populate your database with the initial sample users, groups, and topics, run the seed script. This will make it easier to test the app.
    ```bash
    npm run prisma:seed
    ```

5.  **Start the Development Server:**
    Run the server in development mode. It will automatically restart when you make changes to the code.
    ```bash
    npm run dev
    ```

The backend server should now be running on the port specified in your `.env` file (default is `5001`). You can access it at `http://localhost:5001`.

---

## API Structure

All API routes are versioned under `/api/v1`.

-   `/api/v1/auth`: User authentication (login, register, me).
-   `/api/v1/dashboard`: Learner-facing endpoints to get topics.
-   `/api/v1/ai`: Secure proxy endpoints for Gemini services (quiz, chat, etc.).

Protected routes require a valid JWT to be passed in the `Authorization` header as a Bearer token.
