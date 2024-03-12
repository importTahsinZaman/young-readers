"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function manage_room() {
  const supabase = createClient();
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");
  const [storyData, setStoryData] = useState<any[] | null>(null);

  useEffect(() => {
    const slug = pathname.substring(pathname.lastIndexOf("/") + 1);
    setGamecode(slug);

    const getData = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("game_code", slug);
      setStoryData(data[0]);
    };
    getData();
  }, [pathname]);

  const handleChanges = (payload: any) => {
    setStoryData(payload.new);
  };

  // Listen to changes
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

  const removePlayer = async (playerName: string) => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("game_code", gamecode);

    let story_data = data[0];

    const newPlayerCount = story_data.current_player_count - 1;

    const playerIndex = storyData?.current_players.indexOf(playerName);
    storyData?.current_players.splice(playerIndex, 1);

    await supabase
      .from("stories")
      .update({
        current_player_count: newPlayerCount,
        current_players: storyData?.current_players,
      })
      .eq("game_code", gamecode);
  };

  const removePlayerButtons = storyData?.current_players.map(
    (playerName: string) => (
      <button
        onClick={() => {
          removePlayer(playerName);
        }}
      >
        {playerName}
      </button>
    )
  );

  return (
    <>
      <pre>{JSON.stringify(storyData, null, 2)}</pre>
      {removePlayerButtons}
    </>
  );
}
