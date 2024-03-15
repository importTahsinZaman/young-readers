"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@tremor/react";
import { Card } from "@tremor/react";

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
    <div className="flex flex-row items-center justify-center w-screen h-screen p-16">
      <Card className="w-[100vw] min-h-[70vh] rounded">
        <h1 className="text-lg">{loopText}</h1>
        <br></br>
        {storyData?.current_player_choosing == playerName ? (
          <div className="flex flex-col">
            <h1 className="text-lg">Make a choice!</h1>
            <br></br>
            <Button
              color="gray"
              variant="primary"
              onClick={() => {
                setChoice(1);
              }}
              className="text-[#04090b] text-lg border-none w-fit"
            >
              a. {choiceOptions[1]}
            </Button>
            <Button
              color="gray"
              variant="primary"
              onClick={() => {
                setChoice(2);
              }}
              className="text-[#04090b] text-lg border-none w-fit"
            >
              b. {choiceOptions[2]}
            </Button>
            <Button
              color="gray"
              variant="primary"
              onClick={() => {
                setChoice(3);
              }}
              className="text-[#04090b] text-lg border-none w-fit"
            >
              c. {choiceOptions[3]}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col ">
            <h1 className="text-lg">{userToMakeChoice} is choosing...</h1>
            <br></br>
            <Button
              disabled
              color="gray"
              variant="primary"
              className="text-[#04090b] text-lg text-left border-none w-fit"
            >
              a. {choiceOptions[1]}
            </Button>
            <Button
              disabled
              color="gray"
              variant="primary"
              className="text-[#04090b] text-lg border-none w-fit"
            >
              b. {choiceOptions[2]}
            </Button>
            <Button
              disabled
              color="gray"
              variant="primary"
              className="text-[#04090b] text-lg border-none w-fit"
            >
              c. {choiceOptions[3]}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
