import { createClient } from "@/utils/supabase/server";

export default async function create_room() {
  const supabase = createClient();
  const { data: notes } = await supabase.from("notes").select();

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
