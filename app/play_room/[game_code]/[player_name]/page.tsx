"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@tremor/react";
import { Card } from "@tremor/react";
import Loader from "@/components/loadingSpinner";

export default function play_room() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const [loadingState, setLoadingState] = useState(false);
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
    setLoadingState(false);
  }, []);

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
      if (data[0]?.story_started) {
        const current_loop_data = JSON.parse(
          data[0]?.current_loop_json?.content
        );
        setCurrentLoopNumber(current_loop_data.loop);
        setLoopText(current_loop_data.loop_text);
        setUserToMakeChoice(current_loop_data.user_choice);
        setChoiceOptions(current_loop_data.choices);
      }
      //

      const lowerCasePlayersArray = data[0].current_players.map((string) =>
        string.toLowerCase()
      );

      if (!lowerCasePlayersArray.includes(playerName.toLowerCase())) {
        router.push(`/`);
      }
    };
    getData();
  }, [pathname]);

  const handleChanges = (payload: any) => {
    const lowerCasePlayersArray = payload.new.current_players.map((string) =>
      string.toLowerCase()
    );

    if (!lowerCasePlayersArray.includes(playerName.toLowerCase())) {
      router.push(`/`);
    } else {
      setStoryData(payload.new);
      //
      if (payload.new?.story_started) {
        const current_loop_data = JSON.parse(
          payload.new?.current_loop_json?.content
        );
        setCurrentLoopNumber(current_loop_data.loop);
        setLoopText(current_loop_data.loop_text);
        setUserToMakeChoice(current_loop_data.user_choice);
        setChoiceOptions(current_loop_data.choices);

        if (current_loop_data.loop > 1) {
          const old_loop_data = JSON.parse(
            payload.old?.current_loop_json?.content
          );

          if (current_loop_data.loop > old_loop_data.loop) {
            setLoadingState(false);
          }
        }
      }
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
    setLoadingState(true);
    await supabase
      .from("stories")
      .update({
        recent_choice_made: choice.toString(),
      })
      .eq("game_code", gamecode);
  };

  if (loadingState) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-create-bg bg-cover bg-no-repeat bg-center">
        <Loader></Loader>
      </div>
    );
  }

  if (!storyData?.story_started) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-[80vw] gap-6">
        <h1 className="text-[3rem]  text-primaryBlue">skytales</h1>
        <h1 className="text-xl">Waiting for the story to start!</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-[80vw] gap-6">
      <h1 className="text-[3rem]  text-primaryBlue">skytales</h1>
      <Card className="flex flex-col min-h-[55vh] rounded mx-4 items-center justify-between shadow-lg p-10">
        <div className="grow">
          <h1 className="text-xl">{loopText}</h1>
        </div>

        {!storyData?.story_finished &&
          storyData?.current_player_choosing.toLowerCase() ==
            playerName.toLowerCase() && (
            <h1 className="text-2xl text-semibold">Make a choice!</h1>
          )}

        {!storyData?.story_finished &&
          storyData?.current_player_choosing.toLowerCase() !=
            playerName.toLowerCase() && (
            <h1 className="text-2xl text-semibold">
              {userToMakeChoice} is choosing...
            </h1>
          )}
      </Card>
      {!storyData?.story_finished && (
        <div className="flex flex-row w-full justify-between ">
          <div className="basis-1/2 flex flex-col gap-6 mr-4">
            <button
              disabled={
                storyData?.current_player_choosing.toLowerCase() !=
                playerName.toLowerCase()
              }
              onClick={() => {
                setChoice(1);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#03CD9D] shadow text-white no-underline w-full"
            >
              {choiceOptions[1]}
            </button>
            <button
              disabled={
                storyData?.current_player_choosing.toLowerCase() !=
                playerName.toLowerCase()
              }
              onClick={() => {
                setChoice(2);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#EEAA26] shadow text-white no-underline w-full"
            >
              {choiceOptions[2]}
            </button>
          </div>

          <div className="basis-1/2 flex flex-col gap-6 ml-4">
            <button
              disabled={
                storyData?.current_player_choosing.toLowerCase() !=
                playerName.toLowerCase()
              }
              onClick={() => {
                setChoice(3);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#E84646] shadow text-white no-underline w-full"
            >
              {choiceOptions[3]}
            </button>
            <button
              disabled={
                storyData?.current_player_choosing.toLowerCase() !=
                playerName.toLowerCase()
              }
              onClick={() => {
                setChoice(4);
              }}
              className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#59B941] shadow text-white no-underline w-full"
            >
              {choiceOptions[4]}
            </button>
          </div>
        </div>
      )}

      {storyData?.story_finished && (
        <button
          className="max-w-[30%] w-[30%] items-center justify-center py-4 flex text-xl font-semibold rounded-full bg-primaryBlue shadow-2xl text-white no-underline"
          onClick={() => {
            router.push("/");
          }}
        >
          return home
        </button>
      )}
    </div>
  );
}
