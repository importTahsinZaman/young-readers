"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function play_room() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [storyData, setStoryData] = useState<any[] | null>(null);

  useEffect(() => {
    const slug = pathname.substring(11, 19);
    const playerName = pathname.substring(pathname.lastIndexOf("/") + 1);
    setGamecode(slug);
    setPlayerName(playerName);

    const getData = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("game_code", slug);
      setStoryData(data[0]);

      if (!data[0].current_players.includes(playerName)) {
        router.push(`/`);
      }
    };
    getData();
  }, [pathname]);

  const handleChanges = (payload: any) => {
    if (!payload.new.current_players.includes(playerName)) {
      router.push(`/`);
    } else {
      setStoryData(payload.new);
    }
  };

  // Listen to inserts
  supabase
    .channel("stories")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "stories",
        filter: `game_code=eq.${gamecode}`,
      },
      handleChanges
    )
    .subscribe();

  return <pre>{JSON.stringify(storyData, null, 2)}</pre>;
}
