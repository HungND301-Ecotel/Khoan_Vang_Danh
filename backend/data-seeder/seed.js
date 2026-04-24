const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../model/User");
const connect = require("../config/db");
const SystemConfig = require("../model/SystemConfig");

const adminUser = {
  username: "admin",
  password: "123456",
  role: "admin",
  fullName: "admin",
  email: "admin@gmail.com",
};

const initialConfigs = [
  {
    key: "ĐL",
    value: "ĐL",
    description: "Mã nhóm công đoạn đào lò",
  },
  {
    key: "KT",
    value: "KT",
    description: "Mã nhóm công đoạn khấu than",
  },
  {
    key: "XL",
    value: "XL",
    description: "Mã nhóm công đoạn xén lò",
  },
];

const seedData = async () => {
  try {
    await connect();

    // Seed admin
    const existingAdmin = await User.findOne({ username: adminUser.username });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      await User.create({ ...adminUser, password: hashedPassword });
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }

    // Seed System Configs
    for (const config of initialConfigs) {
      const existingConfig = await SystemConfig.findOne({ key: config.key });
      if (!existingConfig) {
        await SystemConfig.create(config);
        console.log(`✅ System config created: ${config.key}`);
      } else {
        console.log(`ℹ️ System config already exists: ${config.key}`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  }
};

seedData();
