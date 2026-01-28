
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:3000/api';
let token = '';

const login = async () => {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'patient@test.com',
            password: 'password123'
        });
        token = res.data.token;
        console.log("Login successful");
    } catch (e: any) {
        console.error("Login failed", e.response?.data);
        process.exit(1);
    }
};

const run = async () => {
    await login();
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
        // 1. Create a Record via Upload (Patient allowed)
        console.log("1. Creating Record via Upload...");
        const form = new FormData();
        form.append('type', 'PRESCRIPTION');
        form.append('summary', 'Test Deletion Upload');

        // Use a dummy png
        const filePath = path.join(__dirname, 'test_del_full.png');
        fs.writeFileSync(filePath, 'dummy content');
        form.append('file', fs.createReadStream(filePath));

        const uploadRes = await axios.post(`${API_URL}/records`, form, {
            headers: {
                ...headers,
                ...form.getHeaders()
            }
        });

        let recordId = uploadRes.data._id || uploadRes.data.id || uploadRes.data.record?._id;
        console.log(`   Created Record ID: ${recordId}`);

        // Cleanup temp file
        try { fs.unlinkSync(filePath); } catch (e) { }

        // 2. Verify it exists in /records
        console.log("2. Verifying in /records...");
        const recordsRes = await axios.get(`${API_URL}/records`, { headers });
        const existsInRecords = recordsRes.data.some((r: any) => r._id === recordId || r.id === recordId);
        if (!existsInRecords) throw new Error("Record not found in /records after creation");
        console.log("   Confirmed in Records list.");

        // 3. Verify it exists in /records/ongoing
        console.log("3. Verifying in /records/ongoing (Prescriptions)...");
        const ongoingRes = await axios.get(`${API_URL}/records/ongoing`, { headers });
        const existsInOngoing = ongoingRes.data.active.some((m: any) => m.recordId === recordId);
        // Note: File uploads appear as "Prescription File (Processing)" in active meds
        if (!existsInOngoing) {
            console.log("Ongoing response keys:", ongoingRes.data);
            throw new Error("Medicine not found in /records/ongoing after creation");
        }
        console.log("   Confirmed in Ongoing Medicines list.");

        // 4. Delete the Record
        console.log("4. Deleting Record...");
        await axios.delete(`${API_URL}/records/${recordId}`, { headers });
        console.log("   Delete request successful.");

        // 5. Verify GONE from /records
        console.log("5. Verifying REMOVAL from /records...");
        const recordsRes2 = await axios.get(`${API_URL}/records`, { headers });
        const stillInRecords = recordsRes2.data.some((r: any) => r._id === recordId || r.id === recordId);
        if (stillInRecords) throw new Error("Record STILL exists in /records after deletion!");
        console.log("   Confirmed removed from Records list.");

        // 6. Verify GONE from /records/ongoing
        console.log("6. Verifying REMOVAL from /records/ongoing...");
        const ongoingRes2 = await axios.get(`${API_URL}/records/ongoing`, { headers });
        const stillInOngoing = ongoingRes2.data.active.some((m: any) => m.recordId === recordId) ||
            ongoingRes2.data.past.some((m: any) => m.recordId === recordId);
        if (stillInOngoing) throw new Error("Medicine STILL exists in /records/ongoing after deletion!");
        console.log("   Confirmed removed from Ongoing Medicines list.");

        console.log("\nSUCCESS: Record and Prescription deletion verified.");

    } catch (e: any) {
        console.error("FAILURE:", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
            console.error("Response Status:", e.response.status);
        }
        process.exit(1);
    }
};

run();
