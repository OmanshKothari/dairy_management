# 🥛 Daily Dairy Manager

Daily Dairy Manager is a comprehensive full-stack application designed to help dairy businesses manage customers, track milk deliveries, maintain inventory, and handle billing and payments efficiently.

## ✨ Features

-   **Dashboard**: Real-time overview of today's deliveries, revenue, and stock levels.
-   **Customer Management**: Mantain detailed records of customers, their delivery quotas, and pricing.
-   **Delivery Tracking**: Log daily morning and evening deliveries with ease.
-   **Stock & Inventory**: Track milk sources (farms, markets) and monitor current stock against capacity.
-   **Billing & Payments**: Automatically generate monthly bills and record customer payments.
-   **Dockerized**: Fully containerized setup for consistent development and easy deployment.

## 🚀 Tech Stack

-   **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/) + [Ant Design](https://ant.design/) + [Tailwind CSS](https://tailwindcss.com/)
-   **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
-   **Infrastructure**: [Docker](https://www.docker.com/), [Docker Compose](https://docs.docker.com/compose/), [Nginx](https://www.nginx.com/)

## 🛠️ Getting Started

### Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)
-   (Optional) [Node.js](https://nodejs.org/) v20+ for local development

### Quick Start (with Docker)

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/YOUR_USERNAME/daily-dairy-manager.git
    cd daily-dairy-manager
    ```

2.  **Environment Setup**:
    Copy the example environment file and customize it if needed (default values work for Docker).
    ```bash
    cp .env.example .env
    ```

3.  **Run the application**:
    ```bash
    docker-compose up --build -d
    ```

4.  **Initialize Database**:
    ```bash
    docker-compose exec server npx prisma migrate dev --name init
    ```

5.  **Access the App**:
    -   **Frontend**: [http://localhost](http://localhost)
    -   **API Health**: [http://localhost/health](http://localhost/health)

## 🚢 Deployment

For detailed production deployment steps (Render, Railway, etc.), please refer to the [DEPLOYMENT.md](DEPLOYMENT.md) guide.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
