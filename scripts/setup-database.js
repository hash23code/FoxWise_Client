const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blwihylwwqeyjbqnuktw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2loeWx3d3FleWpicW51a3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE2OTk1NiwiZXhwIjoyMDc1NzQ1OTU2fQ.yqQc8NTr6HBFNXfiIi6E7n-lc65n2h0JRj_JrvL-ZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🚀 Setting up FoxWise Client database...\n');

  try {
    // 1. Create activities table
    console.log('📋 Creating activities table...');
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS fc_activities (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          default_cost DECIMAL(10,2),
          icon TEXT,
          color TEXT DEFAULT '#F97316',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_fc_activities_user_id ON fc_activities(user_id);
      `
    });

    if (createTableError) {
      console.log('⚠️  Activities table might already exist or need to be created manually');
    } else {
      console.log('✅ Activities table created!');
    }

    // 2. Insert default activities
    console.log('\n⚡ Adding default activities...');
    const activities = [
      { user_id: 'system', name: 'Déneigement', description: 'Service de déneigement résidentiel et commercial', default_cost: 150.00, color: '#60A5FA' },
      { user_id: 'system', name: 'Émondage', description: 'Élagage et entretien d\'arbres', default_cost: 300.00, color: '#34D399' },
      { user_id: 'system', name: 'Paysagement', description: 'Aménagement paysager complet', default_cost: 500.00, color: '#FBBF24' },
      { user_id: 'system', name: 'Tonte de Gazon', description: 'Service de tonte et entretien de pelouse', default_cost: 75.00, color: '#4ADE80' },
      { user_id: 'system', name: 'Nettoyage', description: 'Nettoyage de terrains et espaces extérieurs', default_cost: 125.00, color: '#A78BFA' },
      { user_id: 'system', name: 'Consultation', description: 'Consultation et estimation', default_cost: 100.00, color: '#F472B6' }
    ];

    const { data: activitiesData, error: activitiesError } = await supabase
      .from('fc_activities')
      .upsert(activities, { onConflict: 'name' })
      .select();

    if (activitiesError) {
      console.log('⚠️  Could not insert activities:', activitiesError.message);
    } else {
      console.log(`✅ Added ${activitiesData?.length || 0} default activities!`);
    }

    // 3. Get sectors
    console.log('\n🏢 Getting sectors...');
    const { data: sectors } = await supabase
      .from('fc_sectors')
      .select('*')
      .limit(3);

    // 4. Add sample clients (use 'system' as user_id for demo)
    console.log('\n👥 Adding sample clients...');
    const sampleClients = [
      {
        user_id: 'system',
        name: 'Jean Tremblay',
        email: 'jean.tremblay@example.com',
        phone: '514-555-0101',
        address: '123 Rue Principale',
        city: 'Montreal',
        postal_code: 'H1A 1A1',
        sector_id: sectors?.[0]?.id || null,
        status: 'active',
        notes: 'Client fidèle depuis 3 ans'
      },
      {
        user_id: 'system',
        name: 'Marie Dubois',
        email: 'marie.dubois@example.com',
        phone: '514-555-0102',
        address: '456 Avenue du Parc',
        city: 'Laval',
        postal_code: 'H7L 2B2',
        sector_id: sectors?.[1]?.id || null,
        status: 'active',
        notes: 'Contrat commercial annuel'
      },
      {
        user_id: 'system',
        name: 'Pierre Gagnon',
        email: 'pierre.gagnon@example.com',
        phone: '514-555-0103',
        address: '789 Boulevard St-Laurent',
        city: 'Quebec',
        postal_code: 'G1K 3C3',
        sector_id: sectors?.[2]?.id || null,
        status: 'prospect',
        notes: 'Intéressé par service de déneigement'
      },
      {
        user_id: 'system',
        name: 'Sophie Martin',
        email: 'sophie.martin@example.com',
        phone: '514-555-0104',
        address: '321 Rue de la Montagne',
        city: 'Montreal',
        postal_code: 'H3G 1Z1',
        sector_id: sectors?.[0]?.id || null,
        status: 'active',
        notes: 'Service d\'émondage régulier'
      },
      {
        user_id: 'system',
        name: 'Luc Bouchard',
        email: 'luc.bouchard@example.com',
        phone: '514-555-0105',
        address: '654 Chemin Côte-des-Neiges',
        city: 'Montreal',
        postal_code: 'H3H 1V4',
        sector_id: sectors?.[1]?.id || null,
        status: 'inactive',
        notes: 'Contrat terminé'
      }
    ];

    const { data: clientsData, error: clientsError } = await supabase
      .from('fc_clients')
      .insert(sampleClients)
      .select();

    if (clientsError) {
      console.log('⚠️  Could not insert sample clients:', clientsError.message);
    } else {
      console.log(`✅ Added ${clientsData?.length || 0} sample clients!`);
    }

    // 5. Summary
    console.log('\n📊 Database Setup Summary:');
    console.log('═══════════════════════════════════════');

    const { data: finalClients } = await supabase.from('fc_clients').select('*', { count: 'exact' });
    const { data: finalActivities } = await supabase.from('fc_activities').select('*', { count: 'exact' });
    const { data: finalSectors } = await supabase.from('fc_sectors').select('*', { count: 'exact' });

    console.log(`✅ ${finalClients?.length || 0} Clients`);
    console.log(`✅ ${finalActivities?.length || 0} Activities`);
    console.log(`✅ ${finalSectors?.length || 0} Sectors`);
    console.log('═══════════════════════════════════════');
    console.log('\n🎉 Database setup complete!');
    console.log('\n💡 Note: Sample data uses user_id="system"');
    console.log('   When you sign in with Clerk, you\'ll need to update these');
    console.log('   or create new data with your actual user_id\n');

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

setupDatabase();
