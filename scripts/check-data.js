const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blwihylwwqeyjbqnuktw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2loeWx3d3FleWpicW51a3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE2OTk1NiwiZXhwIjoyMDc1NzQ1OTU2fQ.yqQc8NTr6HBFNXfiIi6E7n-lc65n2h0JRj_JrvL-ZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking existing data in Supabase...\n');

  // Check users
  const { data: users, error: usersError } = await supabase
    .from('fc_users')
    .select('*');

  console.log('👥 Users:', users?.length || 0);
  if (users?.length) {
    console.log('   Sample:', users[0]);
  }

  // Check clients
  const { data: clients, error: clientsError } = await supabase
    .from('fc_clients')
    .select('*');

  console.log('\n👤 Clients:', clients?.length || 0);
  if (clients?.length) {
    console.log('   First few:', clients.slice(0, 3).map(c => ({ name: c.name, email: c.email, city: c.city })));
  }

  // Check sectors
  const { data: sectors, error: sectorsError } = await supabase
    .from('fc_sectors')
    .select('*');

  console.log('\n🏢 Sectors:', sectors?.length || 0);
  if (sectors?.length) {
    console.log('   List:', sectors.map(s => s.name).join(', '));
  }

  // Check jobs
  const { data: jobs, error: jobsError } = await supabase
    .from('fc_jobs')
    .select('*');

  console.log('\n💼 Jobs:', jobs?.length || 0);
  if (jobs?.length) {
    console.log('   Sample:', jobs[0]);
  }

  // Check job types
  const { data: jobTypes, error: jobTypesError } = await supabase
    .from('fc_job_types')
    .select('*');

  console.log('\n📋 Job Types:', jobTypes?.length || 0);
  if (jobTypes?.length) {
    console.log('   List:', jobTypes.map(jt => jt.name).join(', '));
  }

  // Check activities (might not exist yet)
  const { data: activities, error: activitiesError } = await supabase
    .from('fc_activities')
    .select('*');

  if (!activitiesError) {
    console.log('\n⚡ Activities:', activities?.length || 0);
    if (activities?.length) {
      console.log('   List:', activities.map(a => a.name).join(', '));
    }
  } else {
    console.log('\n⚡ Activities: Table does not exist yet (will be created)');
  }

  console.log('\n✅ Data check complete!');
}

checkData().catch(console.error);
