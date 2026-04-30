const { neon } = require('@neondatabase/serverless');
const { verifyToken } = require('@clerk/backend');

module.exports = async function handler(req, res) {
    try {
        const sql = neon(process.env.DATABASE_URL);
        
        let userId = null;
        let userEmail = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const verified = await verifyToken(token, {
                    secretKey: process.env.CLERK_SECRET_KEY,
                });
                userId = verified.sub;
                
                // If Clerk provides email in token, we can use it.
                if (verified.email) {
                    userEmail = verified.email;
                }
            } catch (e) {
                console.error("Error decoding token", e);
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        if (req.method === 'GET') {
            const { action, email } = req.query;
            
            if (action === 'check_approved') {
                const queryEmail = email || userEmail;
                if (!userId && !queryEmail) return res.status(400).json({ error: 'Missing user context' });
                
                const now = new Date().toISOString();
                // We handle either user_id or email match
                const payments = await sql`
                    SELECT id, utr_number, status, approved_at, expires_at, created_at 
                    FROM ai_tool_payments 
                    WHERE (user_id = ${userId} OR user_email = ${queryEmail})
                    AND status = 'approved'
                    AND expires_at > ${now}
                    ORDER BY approved_at DESC
                    LIMIT 1
                `;
                return res.status(200).json(payments.length > 0 ? payments[0] : null);
            }
            
            if (action === 'check_pending') {
                const queryEmail = email || userEmail;
                if (!userId && !queryEmail) return res.status(400).json({ error: 'Missing user context' });
                
                const payments = await sql`
                    SELECT id, utr_number, created_at 
                    FROM ai_tool_payments 
                    WHERE (user_id = ${userId} OR user_email = ${queryEmail})
                    AND status = 'pending'
                    ORDER BY created_at DESC
                    LIMIT 1
                `;
                return res.status(200).json(payments.length > 0 ? payments[0] : null);
            }
            
            return res.status(400).json({ error: 'Invalid action' });
        }

        if (req.method === 'POST') {
            if (!userId) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            
            const { email, utr, base64, fileExt } = req.body;
            
            const [newPayment] = await sql`
                INSERT INTO ai_tool_payments (
                    user_id, user_email, utr_number, amount, status, screenshot_b64, screenshot_type
                ) VALUES (
                    ${userId}, ${email}, ${utr}, 19, 'pending', ${base64}, ${fileExt}
                ) RETURNING *
            `;
            
            return res.status(201).json(newPayment);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
