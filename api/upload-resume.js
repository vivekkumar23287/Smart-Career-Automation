const { put } = require('@vercel/blob');
const { verifyToken } = require('@clerk/backend');

module.exports = async function handler(req, res) {
  // Check auth
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let userId;
  try {
    const verified = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    userId = verified.sub;
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (req.method === 'POST') {
    try {
      const { filename, contentType, content } = req.body;
      
      // content is a base64 encoded string
      const buffer = Buffer.from(content, 'base64');

      const blob = await put(`resumes/${userId}/${filename}`, buffer, {
        access: 'public',
        contentType: contentType,
      });

      return res.status(200).json({ url: blob.url });
    } catch (error) {
      return res.status(500).json({ error: error.message || 'Error putting blob' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
