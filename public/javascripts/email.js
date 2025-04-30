const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const generateThankYouEmail = (name, amount) => {
    return `
        <h1>Thank You For Your Donation!</h1>
        <p>Dear ${name}</p>
        <p><We are extremely grateful for your generous donation!</p>
        <p>Your support helps us continue! </p>
    `
};