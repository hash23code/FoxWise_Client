const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blwihylwwqeyjbqnuktw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2loeWx3d3FleWpicW51a3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE2OTk1NiwiZXhwIjoyMDc1NzQ1OTU2fQ.yqQc8NTr6HBFNXfiIi6E7n-lc65n2h0JRj_JrvL-ZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

// This will be your actual Clerk user ID when you sign in
// For now we use 'system' for demo
const USER_ID = 'system';

async function importClients() {
  console.log('📂 Reading Excel file...\n');

  try {
    // Read the Excel file
    const workbook = XLSX.readFile('H:\\Ai_Projects\\app\\claude\\Banque_clients_Deneigement_2025_2026_colonnes_ajustees (1).xlsx');

    // Get first sheet (clients)
    const clientSheet = workbook.Sheets[workbook.SheetNames[0]];
    const clientsData = XLSX.utils.sheet_to_json(clientSheet);

    console.log(`📊 Found ${clientsData.length} clients in Excel\n`);

    // Get or create sectors from the Excel sheet tabs
    console.log('🏢 Processing sectors...');
    const sectorNames = workbook.SheetNames.filter(name => name !== workbook.SheetNames[0]);
    console.log(`   Found sectors: ${sectorNames.join(', ')}\n`);

    // First, get existing sectors
    const { data: existingSectors } = await supabase
      .from('fc_sectors')
      .select('*');

    console.log(`   Existing sectors in DB: ${existingSectors?.length || 0}`);

    // Map sector names to IDs
    const sectorMap = {};
    for (const sector of existingSectors || []) {
      sectorMap[sector.name] = sector.id;
    }

    console.log('\n👥 Importing clients...');

    let imported = 0;
    let errors = 0;

    for (const row of clientsData) {
      try {
        // Map Excel columns to database fields
        const client = {
          user_id: USER_ID,
          name: row['Nom'] || row['Client'] || row['Nom du client'] || 'Sans nom',
          email: row['Email'] || row['Courriel'] || null,
          phone: row['Téléphone'] || row['Tel'] || row['Phone'] || null,
          address: row['Adresse'] || row['Rue'] || null,
          city: row['Ville'] || row['City'] || null,
          postal_code: row['Code postal'] || row['CP'] || null,
          status: 'active',
          notes: row['Notes'] || row['Commentaires'] || null
        };

        // Try to match sector
        const sectorName = row['Secteur'] || row['Sector'];
        if (sectorName && sectorMap[sectorName]) {
          client.sector_id = sectorMap[sectorName];
        }

        // Insert client
        const { error } = await supabase
          .from('fc_clients')
          .insert([client]);

        if (error) {
          console.log(`   ⚠️  Error importing ${client.name}: ${error.message}`);
          errors++;
        } else {
          imported++;
          if (imported % 10 === 0) {
            console.log(`   ✅ Imported ${imported} clients...`);
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Error processing row:`, err.message);
        errors++;
      }
    }

    console.log('\n📊 Import Summary:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Successfully imported: ${imported} clients`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log('═══════════════════════════════════════');

    // Show final count
    const { data: finalClients, count } = await supabase
      .from('fc_clients')
      .select('*', { count: 'exact' });

    console.log(`\n🎉 Total clients in database: ${count || finalClients?.length || 0}`);
    console.log('\n✨ Import complete! Your clients are ready!\n');

  } catch (error) {
    console.error('❌ Import error:', error);
  }
}

importClients();
