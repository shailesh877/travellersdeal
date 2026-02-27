const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a transporter using ethereal email (for testing) if no SMTP details provided
    let transporter;

    if (process.env.SMTP_HOST) {
        // Production / Real Email Setup
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT, // e.g., 465
            secure: process.env.SMTP_PORT == 465, // true for 465 (SSL), false for other ports (TLS)
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
            tls: {
                // Do not fail on invalid certs
                rejectUnauthorized: false
            }
        });
    } else {
        // Fallback testing setup
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
    }

    const message = {
        from: `${process.env.FROM_NAME || 'Travellers Deal'} <${process.env.FROM_EMAIL || 'noreply@travellersdeal.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);

    console.log("Message sent: %s", info.messageId);

    // In testing mode, output the URL to view the email
    if (!process.env.SMTP_HOST) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
};

module.exports = sendEmail;
