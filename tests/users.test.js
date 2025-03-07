/////// ce teste ets uppose verifier que la route post envoi
/////// bien un user et que le user n'existe pas deja dans la base de donnees

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User'); // Assuming you have a User model
const usersRouter = require('../routes/users');

const app = express();
app.use(express.json());
app.use('/users', usersRouter);
const connectionString = process.env.CONNECTION_STRING;


describe('POST /users/signup', () => {
    it("creation d'un user", async () => {
        await mongoose.connect(`${connectionString}`, { useNewUrlParser: true, useUnifiedTopology: true });

        const response = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(201);
        expect(response.body.result).toBe(true);

        await User.deleteMany({});//////// efface les donnees entrees  pour clean la base de donnees
        await mongoose.connection.close();
    });

    it("verification de la presence d' un user a la creation", async () => {
        await mongoose.connect(`${connectionString}`, { useNewUrlParser: true, useUnifiedTopology: true });

        await new User({ email: 'test@example.com', password: 'password123' }).save();

        const response = await request(app)
            .post('/users/signup')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(response.status).toBe(400);
        expect(response.body.result).toBe(false);
        expect(response.body.message).toBe('User already exists');

        await User.deleteMany({});//////// efface les donnees entrees  pour clean la base de donnees
        await mongoose.connection.close();
    });
});