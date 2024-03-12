"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function manage_room() {
  const supabase = createClient();
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");
  const [notes, setNotes] = useState<any[] | null>(null);

  useEffect(() => {
    const slug = pathname.substring(pathname.lastIndexOf("/") + 1);
    setGamecode(slug);

    const getData = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("game_code", slug);
      setNotes(data);
    };
    getData();
  }, [pathname]);

  return <pre>{JSON.stringify(notes, null, 2)}</pre>;
}
