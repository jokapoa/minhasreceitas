import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgres://postgres.pxwoqnwqpgzxchthggib:0lW8PoJICkcK63iI@aws-0-sa-east-1.pooler.supabase.com:5432/postgres';

async function setup() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to PostgreSQL successfully!');

  const sql = `
    -- 1. Recipes Table
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      sync_code TEXT NOT NULL DEFAULT 'joka-receitas',
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      image TEXT DEFAULT '',
      prep_time_minutes INTEGER DEFAULT 15,
      cook_time_minutes INTEGER DEFAULT 20,
      servings INTEGER DEFAULT 4,
      difficulty TEXT DEFAULT 'Fácil',
      cuisine TEXT DEFAULT 'Brasileira',
      category TEXT DEFAULT 'Almoço',
      tags TEXT[] DEFAULT '{}',
      source_url TEXT DEFAULT '',
      source_platform TEXT DEFAULT 'manual',
      video_embed_url TEXT DEFAULT '',
      author TEXT DEFAULT '',
      rating NUMERIC DEFAULT 5.0,
      favorite BOOLEAN DEFAULT false,
      notes TEXT DEFAULT '',
      ingredients JSONB DEFAULT '[]'::jsonb,
      instructions JSONB DEFAULT '[]'::jsonb,
      nutrition JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_sync_code ON recipes (sync_code);

    -- 2. Cookbooks Table
    CREATE TABLE IF NOT EXISTS cookbooks (
      id TEXT PRIMARY KEY,
      sync_code TEXT NOT NULL DEFAULT 'joka-receitas',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT '📖',
      color TEXT DEFAULT '#F97316',
      recipe_ids TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_cookbooks_sync_code ON cookbooks (sync_code);

    -- 3. Meal Plans Table
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      sync_code TEXT NOT NULL DEFAULT 'joka-receitas',
      date DATE NOT NULL,
      meal_type TEXT NOT NULL,
      recipe_id TEXT NOT NULL,
      servings INTEGER DEFAULT 4,
      custom_notes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_meal_plans_sync_code ON meal_plans (sync_code);

    -- 4. Grocery Items Table
    CREATE TABLE IF NOT EXISTS grocery_items (
      id TEXT PRIMARY KEY,
      sync_code TEXT NOT NULL DEFAULT 'joka-receitas',
      name TEXT NOT NULL,
      amount NUMERIC DEFAULT 1,
      unit TEXT DEFAULT 'un',
      category TEXT DEFAULT 'Outros',
      checked BOOLEAN DEFAULT false,
      recipe_id TEXT DEFAULT '',
      recipe_title TEXT DEFAULT '',
      added_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_grocery_items_sync_code ON grocery_items (sync_code);

    -- Enable Row Level Security (RLS) and permissive access for sync_code
    ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE cookbooks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
    ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if any
    DROP POLICY IF EXISTS "Public access to recipes" ON recipes;
    DROP POLICY IF EXISTS "Public access to cookbooks" ON cookbooks;
    DROP POLICY IF EXISTS "Public access to meal_plans" ON meal_plans;
    DROP POLICY IF EXISTS "Public access to grocery_items" ON grocery_items;

    -- Create open policies for anon access
    CREATE POLICY "Public access to recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access to cookbooks" ON cookbooks FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access to meal_plans" ON meal_plans FOR ALL USING (true) WITH CHECK (true);
    CREATE POLICY "Public access to grocery_items" ON grocery_items FOR ALL USING (true) WITH CHECK (true);

    -- Enable Realtime for all tables
    ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
    ALTER PUBLICATION supabase_realtime ADD TABLE cookbooks;
    ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
    ALTER PUBLICATION supabase_realtime ADD TABLE grocery_items;
  `;

  try {
    await client.query(sql);
    console.log('✅ Tables, Indexes, RLS and Realtime successfully configured in Supabase PostgreSQL!');
  } catch (err) {
    console.error('SQL Execution error:', err);
  } finally {
    await client.end();
  }
}

setup();
