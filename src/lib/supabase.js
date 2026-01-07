import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndpsxqalbwixdzssnhim.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHN4cWFsYndpeGR6c3NuaGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NjU1MDIsImV4cCI6MjA4MzM0MTUwMn0.AiCan6qGx5l1JA_3EceArhG1Lj7pMTusKQ406hCiQl4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
