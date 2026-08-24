require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travellers_deal').then(async () => {
    const User = require('./models/User');
    const email = 'superadmin@travellersdeal.com';
    const password = 'SuperAdmin123!';
    
    let user = await User.findOne({ email });
    if (user) {
        user.isSuperAdmin = true;
        user.role = 'admin';
        user.isActive = true;
        user.password = password; // The pre-save hook in User model will hash this automatically!
        await user.save();
        console.log('Updated existing superadmin account');
    } else {
        await User.create({
            name: 'Master Super Admin',
            email: email,
            password: password, // The pre-save hook hashes it
            role: 'admin',
            isSuperAdmin: true,
            adminPermissions: [],
            isActive: true,
            isVerified: true,
            provider: 'local'
        });
        console.log('Created new superadmin account');
    }
    process.exit();
}).catch(e => {
    console.error(e);
    process.exit(1);
});
