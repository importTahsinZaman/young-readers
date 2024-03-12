"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function manage_room() {
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");

  useEffect(() => {
    const slug = pathname.substring(pathname.lastIndexOf("/") + 1);
    setGamecode(slug);
  }, [pathname]);

  return <></>;
}
