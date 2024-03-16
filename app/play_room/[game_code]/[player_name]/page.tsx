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
    <div className="flex flex-col items-center justify-center h-screen w-[80vw] gap-6">
      <h1 className="text-[3rem]  text-primaryBlue">skytales</h1>
      <Card className="flex flex-col min-h-[55vh] rounded mx-4 items-center justify-between shadow-lg p-10">
        <div className="grow">
          <h1 className="text-xl">{loopText}</h1>
        </div>

        {storyData?.current_player_choosing == playerName ? (
          <h1 className="text-2xl text-semibold">Make a choice!</h1>
        ) : (
          <h1 className="text-2xl text-semibold">
            {userToMakeChoice} is choosing...
          </h1>
        )}
      </Card>
      {storyData?.current_player_choosing == playerName ? (
        <div className="flex flex-row w-full justify-between">
          <div className="grow flex flex-col gap-6 mr-4">
            <button
              onClick={() => {
                setChoice(1);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#03CD9D] shadow text-white no-underline w-full"
            >
              a. {choiceOptions[1]}
            </button>
            <button
              onClick={() => {
                setChoice(2);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#EEAA26] shadow text-white no-underline w-full"
            >
              b. {choiceOptions[2]}
            </button>
          </div>

          <div className="grow flex flex-col gap-6 ml-4">
            <button
              onClick={() => {
                setChoice(3);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#E84646] shadow text-white no-underline w-full"
            >
              c. {choiceOptions[3]}
            </button>
            <button
              onClick={() => {
                setChoice(3);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#59B941] shadow text-white no-underline w-full"
            >
              c. {choiceOptions[3]}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col ">
          <h1 className="text-lg">{userToMakeChoice} is choosing...</h1>
          <br></br>
          <Button
            disabled
            variant="primary"
            className="text-[#04090b] text-lg text-left border-none "
          >
            a. {choiceOptions[1]}
          </Button>
          <Button
            disabled
            variant="primary"
            className="text-[#04090b] text-lg border-none "
          >
            b. {choiceOptions[2]}
          </Button>
          <Button
            disabled
            variant="primary"
            className="text-[#04090b] text-lg border-none "
          >
            c. {choiceOptions[3]}
          </Button>
        </div>
      )}
    </div>
  );
}
