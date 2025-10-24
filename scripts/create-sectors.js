const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://blwihylwwqeyjbqnuktw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsd2loeWx3d3FleWpicW51a3R3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE2OTk1NiwiZXhwIjoyMDc1NzQ1OTU2fQ.yqQc8NTr6HBFNXfiIi6E7n-lc65n2h0JRj_JrvL-ZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

const USER_ID = 'system';

const colors = [
  '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#F97316', '#A855F7', '#14B8A6'
];

async function createSectors() {
  console.log('🏢 Creating your sectors...\n');

  const sectors = [
    { name: 'Domaine Nouvelle France', description: 'Secteur Domaine Nouvelle France' },
    { name: 'La Baie Noire', description: 'Secteur La Baie Noire' },
    { name: 'Lac Richer', description: 'Lac Richer - Ch. Linda - Ch. Gu' },
    { name: 'Lac St-Louis', description: 'Secteur Lac St-Louis' },
    { name: 'Lac Grotte', description: 'Secteur Lac Grotte' },
    { name: 'Lac Farmer', description: 'Secteur Lac Farmer' },
    { name: 'Lac Louisa', description: 'Secteur Lac Louisa' },
    { name: 'Ch. Perrier', description: 'Ch. Perrier - Rue des Pivoines' },
    { name: 'Pine Hill', description: 'Secteur Pine Hill' }
  ];

  let created = 0;
  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    sector.user_id = USER_ID;
    sector.color = colors[i % colors.length];

    const { error } = await supabase
      .from('fc_sectors')
      .upsert([sector], { onConflict: 'name' });

    if (!error) {
      console.log(`✅ ${sector.name}`);
      created++;
    } else {
      console.log(`⚠️  ${sector.name}: ${error.message}`);
    }
  }

  console.log(`\n🎉 Created/updated ${created} sectors!`);

  // Show all sectors
  const { data } = await supabase
    .from('fc_sectors')
    .select('*')
    .order('name');

  console.log(`\n📊 Total sectors in database: ${data?.length || 0}\n`);
}

createSectors();
