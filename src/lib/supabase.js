import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jobelqxogicfedghwrsu.supabase.co";
// const supabaseKey = import.meta.env.SUPABASE_KEY;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvYmVscXhvZ2ljZmVkZ2h3cnN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMjY1NTAsImV4cCI6MjA3NDYwMjU1MH0.zgwYR0Q8TUwpkIaZwLcRwUeaoLY6CGPUj9ByuVCF-R8";
console.log("Supabase Key:", supabaseKey); // Kiểm tra giá trị của SUPABASE_KEY
export const supabase = createClient(supabaseUrl, supabaseKey);
