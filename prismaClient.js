// backend/prismaClient.js
// Use the Prisma Client generated in ./generated/prisma

const { PrismaClient } = require('./generated/prisma');

const prisma = new PrismaClient();

module.exports = prisma;
