
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

async function resetSuperAdmin() {
  const email = "admin@divingsanatan.com";
  const password = "adminpassword123!"; // You can change this
  const hashedPassword = hashPassword(password);

  console.log(`Setting up super admin with email: ${email}`);

  // Check if exists
  const { data: existingUser } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    console.log("User exists, updating password and role...");
    const { error } = await supabase
      .from('user_profiles')
      .update({ password: hashedPassword, role: 'super_admin' })
      .eq('email', email);
    
    if (error) console.error("Error updating:", error);
    else console.log(`Success! Password reset to: ${password}`);
  } else {
    console.log("User does not exist, creating new super admin...");
    const { error } = await supabase
      .from('user_profiles')
      .insert([
        { 
          id: 'admin-' + Date.now(),
          email: email, 
          password: hashedPassword, 
          role: 'super_admin',
          name: 'Super Admin',
          phone: '0000000000',
          gender: 'Other',
          dob: '2000-01-01',
          category: 'Admin'
        }
      ]);

    if (error) console.error("Error creating:", error);
    else console.log(`Success! Super admin created with password: ${password}`);
  }
}

resetSuperAdmin();
