import app from './app';
import connectDB from './config/db.connect';

const PORT = process.env.PORT || 3000;

// Connect to Database then start server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`HealthHive Server running on port ${PORT}`);
    });
});
