const { neon } = require('@neondatabase/serverless');
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

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const applications = await sql`
        SELECT * FROM applications WHERE user_id = ${userId} ORDER BY application_date DESC
      `;
      return res.status(200).json(applications);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const result = await sql`
        INSERT INTO applications (
          user_id, company_name, job_title, job_description, application_date, 
          source, location, status, hr_name, hr_email, salary, job_url, resume_url
        ) VALUES (
          ${userId}, ${body.company_name}, ${body.job_title}, ${body.job_description || null}, 
          ${body.application_date}, ${body.source}, ${body.location || null}, ${body.status}, 
          ${body.hr_name || null}, ${body.hr_email || null}, ${body.salary || null}, ${body.job_url || null}, ${body.resume_url || null}
        ) RETURNING *
      `;
      return res.status(201).json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, ...body } = req.body;
      const result = await sql`
        UPDATE applications SET 
          company_name = ${body.company_name},
          job_title = ${body.job_title},
          job_description = ${body.job_description || null},
          application_date = ${body.application_date},
          source = ${body.source},
          location = ${body.location || null},
          status = ${body.status},
          hr_name = ${body.hr_name || null},
          hr_email = ${body.hr_email || null},
          salary = ${body.salary || null},
          job_url = ${body.job_url || null},
          resume_url = ${body.resume_url || null},
          updated_at = NOW()
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING *
      `;
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(result[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      const result = await sql`
        DELETE FROM applications WHERE id = ${id} AND user_id = ${userId} RETURNING *
      `;
      if (result.length === 0) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

