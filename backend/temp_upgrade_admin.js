const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/travellers_deal').then(async () => {
    const User = require('./models/User');
    await User.updateMany({ role: 'admin' }, { $set: { isSuperAdmin: true } });
    console.log('Admins upgraded to Super Admins');
    process.exit();
}).catch(console.error);
