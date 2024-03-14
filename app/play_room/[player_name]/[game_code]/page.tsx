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
  //
  const [currentLoopNumber, setCurrentLoopNumber] = useState(1);
  const [loopText, setLoopText] = useState("");
  const [userToMakeChoice, setUserToMakeChoice] = useState("");
  const [choiceOptions, setChoiceOptions] = useState("");
  //

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

      //
      const current_loop_data = JSON.parse(data[0]?.current_loop_json?.content);
      setCurrentLoopNumber(current_loop_data.loop);
      setLoopText(current_loop_data.loop_text);
      setUserToMakeChoice(current_loop_data.user_choice);
      setChoiceOptions(current_loop_data.choices);
      //

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
      //
      const current_loop_data = JSON.parse(
        payload.new?.current_loop_json?.content
      );
      setCurrentLoopNumber(current_loop_data.loop);
      setLoopText(current_loop_data.loop_text);
      setUserToMakeChoice(current_loop_data.user_choice);
      setChoiceOptions(current_loop_data.choices);
      //
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

  const setChoice = async (choice: number) => {
    await supabase
      .from("stories")
      .update({
        recent_choice_made: choice.toString(),
      })
      .eq("game_code", gamecode);
  };

  return (
    <>
      <div className="max-w-[50vw]">
        <h1>Current Loop Number: {currentLoopNumber}</h1>
        <h1>User to make choice: {userToMakeChoice}</h1>
        <h1>Loop Text: {loopText}</h1>
        <h1>Choice Option 1: {choiceOptions[1]}</h1>
        <h1>Choice Option 2: {choiceOptions[2]}</h1>
        <h1>Choice Option 3: {choiceOptions[3]}</h1>
      </div>
      {storyData?.current_player_choosing == playerName ? (
        <div className="flex flex-col">
          <button
            onClick={() => {
              setChoice(1);
            }}
          >
            1
          </button>
          <button
            onClick={() => {
              setChoice(2);
            }}
          >
            2
          </button>
          <button
            onClick={() => {
              setChoice(3);
            }}
          >
            3
          </button>
        </div>
      ) : null}
    </>
  );
}
