const { neon } = require('@neondatabase/serverless');
const { verifyToken } = require('@clerk/backend');


module.exports = async function handler(req, res) {
    try {
        const sql = neon(process.env.DATABASE_URL);
        
        // Get user from Clerk auth context
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const verified = await verifyToken(token, {
                    secretKey: process.env.CLERK_SECRET_KEY,
                });
                userId = verified.sub;
            } catch (e) {
                console.error("Error decoding token", e);
                return res.status(401).json({ error: 'Invalid token' });
            }
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (req.method === 'GET') {
            const analyses = await sql`
                SELECT * FROM resume_analyses 
                WHERE user_id = ${userId} 
                ORDER BY created_at DESC 
                LIMIT 5
            `;
            return res.status(200).json(analyses);
        }

        if (req.method === 'POST') {
            const { fileName, results } = req.body;
            
            const [newAnalysis] = await sql`
                INSERT INTO resume_analyses (
                    user_id, resume_name, total_score, section_scores, analysis_results
                ) VALUES (
                    ${userId}, ${fileName}, ${results.score}, 
                    ${JSON.stringify({
                        keywords: results.keywordScore,
                        skills: results.skillScore,
                        formatting: results.formatScore,
                        experience: results.experienceScore,
                        density: results.densityScore
                    })}, 
                    ${JSON.stringify({
                        matched: results.matched,
                        missing: results.missing
                    })}
                ) RETURNING *
            `;
            
            return res.status(201).json(newAnalysis);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error', message: error.message });
    }
}
