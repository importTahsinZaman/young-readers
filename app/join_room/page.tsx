"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function join_room() {
  const [notes, setNotes] = useState<any[] | null>(null);
  const supabase = createClient();

  // Create a function to handle inserts
  const handleInserts = (payload) => {
    setNotes(payload);
  };

  // Listen to inserts
  supabase
    .channel("notes")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notes" },
      handleInserts
    )
    .subscribe();

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from("notes").select();
      setNotes(data);
    };
    getData();
  }, []);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
