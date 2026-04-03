import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jlivijgyrbcfkyxtzzgo.supabase.co",
  "sb_publishable_XMJdcs_zHLNFmgEMJeAA7g_y5qogESX"
);

const { data, error } = await supabase.auth.signUp({
  email: "test123@gmail.com",
  password: "test123456"
});

console.log("data:", JSON.stringify(data, null, 2));
console.log("error:", error);
