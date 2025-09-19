// Quick test to check Supabase connection
// Run this in your browser console to test the connection

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
    
    console.log('✅ Basic connection works');
    
    // Test profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError);
      return false;
    }
    
    console.log('✅ Profiles query works, found', profiles?.length || 0, 'users');
    console.log('Sample data:', profiles);
    
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return false;
  }
}

// Run the test
testSupabaseConnection();
