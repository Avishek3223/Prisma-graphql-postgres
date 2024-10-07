// index.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require("@apollo/server/express4");
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

// Initialize express app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// PostgreSQL connection setup
const pool = new Pool({
  user: 'postgres',       // Replace with your PostgreSQL username
  host: 'localhost',      // The server's host
  database: 'Course Management System',   // Replace with your PostgreSQL database name
  password: 'Password@123',   // Replace with your PostgreSQL password
  port: 5432               // Default PostgreSQL port
});

// GraphQL schema
const typeDefs = `
  type Course {
    id: ID!
    course_name: String!
    description: String
    created_at: String
  }

  type Query {
    courses: [Course]
    course(id: ID!): Course
  }

  type Mutation {
    addCourse(course_name: String!, description: String): Course
    updateCourse(id: ID!, course_name: String, description: String): Course
    deleteCourse(id: ID!): Course
  }
`;

// Resolvers
const resolvers = {
  Query: {
    courses: async () => {
      const result = await pool.query('SELECT * FROM "Courses"');
      return result.rows;
    },
    course: async (_, { id }) => {
      const result = await pool.query('SELECT * FROM "Courses" WHERE id = $1', [id]);
      return result.rows[0];
    },
  },
  Mutation: {
    addCourse: async (_, { course_name, description }) => {
      const result = await pool.query(
        'INSERT INTO "Courses" (course_name, description) VALUES ($1, $2) RETURNING *',
        [course_name, description]
      );
      return result.rows[0];
    },
    updateCourse: async (_, { id, course_name, description }) => {
      const result = await pool.query(
        'UPDATE "Courses" SET course_name = $1, description = $2 WHERE id = $3 RETURNING *',
        [course_name, description, id]
      );
      return result.rows[0];
    },
    deleteCourse: async (_, { id }) => {
      const result = await pool.query('DELETE FROM "Courses" WHERE id = $1 RETURNING *', [id]);
      return result.rows[0];
    },
  },
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Start the Apollo Server
const startServer = async () => {
  await server.start();

  // Use expressMiddleware
  app.use('/graphql', expressMiddleware(server)); // Using express middleware

  // Start the Express server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}/graphql`);
  });
};

startServer();
