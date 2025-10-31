const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../model/User');
const connect = require('../config/db');

const adminUser = {
    username: 'admin',
    password: '123456',
    role: 'admin',
    fullName: 'admin',
    email: 'admin@gmail.com'
};

const seedAdmin = async () => {
    try {

        await connect();// sửa lại URI nếu cần

        // Seed admin
        const existingAdmin = await User.findOne({ username: adminUser.username });
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminUser.password, salt);
            await User.create({ ...adminUser, password: hashedPassword });
            console.log('✅ Admin user created');
        } else {
            console.log('ℹ️ Admin user already exists');
        }

    } catch (error) {
        console.error('❌ Error seeding data:', error);
    }
};

seedAdmin();
