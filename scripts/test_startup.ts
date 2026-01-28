
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import express from 'express';

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

const testStartup = async () => {
    try {
        console.log("1. Checking Environment...");
        const mongoURI = process.env.MONGODB_URI;
        if (!mongoURI) throw new Error('MONGODB_URI missing');
        console.log("   - URI found");

        console.log("2. Connecting to MongoDB...");
        await mongoose.connect(mongoURI);
        console.log("   - MongoDB Connected");

        console.log("3. Loading Application Logic...");
        require('../src/controllers/record.controller');
        console.log("   - Record Controller Loaded");

        console.log("4. Testing Server Port Binding (Mock)...");
        const app = express();
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`   - Server bound to port ${PORT} successfully`);
            server.close(() => {
                console.log("   - Server closed.");
                mongoose.disconnect().then(() => {
                    console.log("DIAGNOSTICS PASSED: Backend is healthy.");
                    process.exit(0);
                });
            });
        });

        server.on('error', (e: any) => {
            console.error("   - PORT BINDING ERROR:", e.code);
            process.exit(1);
        });

    } catch (error) {
        console.error("DIAGNOSTICS FAILED:", error);
        process.exit(1);
    }
};

testStartup();
