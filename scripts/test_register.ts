
import axios from 'axios';

const testRegister = async () => {
    try {
        const uniqueEmail = `test.female.${Date.now()}@test.com`;
        console.log(`Registering ${uniqueEmail}...`);

        const res = await axios.post('http://localhost:5000/api/auth/register', {
            email: uniqueEmail,
            password: 'password123',
            role: 'PATIENT',
            gender: 'Female'
        });

        console.log('Registration Status:', res.status);
        console.log('Response:', res.data);

    } catch (error: any) {
        console.error('Registration Failed:', error.response?.data || error.message);
    }
};

testRegister();
