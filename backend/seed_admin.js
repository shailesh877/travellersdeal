const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Picks up .env from backend automatically since script is there

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB Connected for Seed');

        // We only need a quick schema for this
        const userSchema = new mongoose.Schema({
            name: { type: String, required: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, enum: ['user', 'vendor', 'admin'], default: 'user' }
        });

        // Use existing model if defined, else create
        const User = mongoose.models.User || mongoose.model('User', userSchema);

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@exmaple.com' });
        if (adminExists) {
            console.log('Admin already exists! Skipping creation.');
            process.exit();
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.create({
            name: 'Admin User',
            email: 'admin@exmaple.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Admin user created successfully! Email: admin@exmaple.com');
        process.exit();
    }).catch(err => {
        console.error('Error connecting to DB:', err);
        process.exit(1);
    });
