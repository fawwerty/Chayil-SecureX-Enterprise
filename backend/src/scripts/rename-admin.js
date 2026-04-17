require('dotenv').config();
const { pool } = require('../utils/db');

async function renameAdmin() {
  console.log('Renaming admin user...');
  let client;
  try {
    client = await pool.connect();
    
    // Rename any user explicitly named 'Seth Odoi Asare' or the main admin
    const result = await client.query(
      `UPDATE users 
       SET name = 'Enterprise Admin' 
       WHERE name = 'Seth Odoi Asare' OR email = 'admin@chayilsecurex.com'
       RETURNING *`
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Updated admin user:', result.rows[0].email, '->', result.rows[0].name);
    } else {
      console.log('⚠️ No matching user found to rename.');
    }

  } catch (err) {
    console.error('Error renaming user:', err.message);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

renameAdmin();
