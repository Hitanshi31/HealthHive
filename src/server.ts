import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`HealthHive Server running on port ${PORT}`);
});
