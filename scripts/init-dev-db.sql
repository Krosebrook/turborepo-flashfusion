-- Initialize development database
CREATE DATABASE IF NOT EXISTS flashfusion_dev;

-- Create user for development
CREATE USER IF NOT EXISTS 'flashfusion'@'%' IDENTIFIED BY 'flashfusion_dev';
GRANT ALL PRIVILEGES ON flashfusion_dev.* TO 'flashfusion'@'%';

-- Switch to development database
USE flashfusion_dev;

-- Create basic tables for development
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    session_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Insert sample data for development
INSERT INTO users (email, name) VALUES 
    ('admin@flashfusion.dev', 'Admin User'),
    ('test@flashfusion.dev', 'Test User');

INSERT INTO projects (name, description, user_id) VALUES 
    ('Sample Project', 'A sample project for development', 1),
    ('Test Project', 'Another test project', 2);

FLUSH PRIVILEGES;