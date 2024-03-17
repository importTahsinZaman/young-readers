"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import OpenAI from "openai";
import { Card } from "@tremor/react";
import { useRouter } from "next/navigation";

export default function manage_room() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");
  const [storyData, setStoryData] = useState<any[] | null>(null);
  const [allLoopJSON, setAllLoopJSON] = useState<any[] | null>(null);

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    const slug = pathname.substring(pathname.lastIndexOf("/") + 1);
    setGamecode(slug);

    const getData = async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("game_code", slug);
      setStoryData(data[0]);
      setAllLoopJSON(data[0].all_loop_json);
    };
    getData();
  }, [pathname]);

  const handleChanges = (payload: any) => {
    setStoryData(payload.new);
    setAllLoopJSON(payload.new.all_loop_json);

    if (
      payload.eventType == "UPDATE" &&
      payload.new.recent_choice_made != null &&
      payload.new.recent_choice_made != payload.old.recent_choice_made
    ) {
      if (
        payload.new.current_loop ==
        payload.new.max_player_count * payload.new.loop_count
      ) {
        runFinalLoop(payload.new.recent_choice_made);
      } else {
        runNextLoop(payload.new.recent_choice_made);
      }
    }
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

  const removePlayerButtons = storyData?.current_players?.map(
    (playerName: string) => (
      <button
        className="border-2 border-primaryBlue text-primaryBlue font-semibold rounded-full w-44 h-14 hover:border-red-500 hover:text-red-500"
        key={playerName}
        onClick={() => {
          removePlayer(playerName);
        }}
      >
        {playerName}
      </button>
    )
  );

  async function startStory() {
    if (storyData.current_player_count != storyData.max_player_count) {
      alert("Max players not reached!");
    } else {
      try {
        const initMessage = `Your job is to write a multiplayer choose your own adventure story. There are going to be users who correspond to characters in the story, and your job is to write an interactive story based on a given theme. The "loop" parameter is how many times each user will be given the opportunity to make a choice in the story.  EVERY one of your responses should be A SINGLE loop, IN JSON FORMAT (this is mandatory) of { "loop": (loop number), "loop_text": (the text in the loop), "user_choice": (which user is making a choice), "choices": { "1": "", "2": "", "3": “”, ”4”: "" } } So if there are 4 loops and 5 characters, there will be 20 total choices made (4 choices by each of 5 characters/users.) The story should change based on the choice made in each loop. The choice options given to a player should be choices for what THAT player does in the story, a player should not receive choices that determine the actions of a different player in the story! Give one loop at a time and the user will input which choice they want. Write the story from the third person. There should be 4 choice options per loop. The very last loop should be #(number of players * number of loops) + 1. This loop should conclude the story, without giving a choice to any user. So if there are 4 loops and 5 characters/users, the last loop would be loop #21. THE USER WILL INPUT THEIR CHOICE AFTER EVERY LOOP, DO NOT DECIDE IT FOR YOURSELF. One user should not be in charge of making the choice for more than 2 loops in a row! EACH LOOP SHOULD CONTAIN ABOUT 180 WORDS OR ABOUT 14 SENTENCES. KEEP GIVING CHOICES AND DO NOT END THE STORY UNTIL THE VERY LAST LOOP. Here are the parameters: { Theme: ${storyData?.theme}, Characters: ${storyData?.current_players}, Loops: ${storyData?.loop_count} Grade Level: ${storyData?.grade_level} }`;

        const completion = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant.`,
            },
            {
              role: "user",
              content: initMessage,
            },
          ],
          model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0].message);
        console.log(typeof completion.choices[0].message);

        const allLoopJSON = [
          {
            role: "system",
            content: `You are a helpful assistant.`,
          },
          {
            role: "user",
            content: initMessage,
          },
          completion.choices[0].message,
        ];

        const currentPlayerChoosing = JSON.parse(
          completion.choices[0].message.content
        ).user_choice;

        console.log(currentPlayerChoosing);

        await supabase
          .from("stories")
          .update({
            all_loop_json: allLoopJSON,
            story_started: true,
            current_loop_json: completion.choices[0].message,
            current_player_choosing: currentPlayerChoosing,
            current_loop: 1,
          })
          .eq("game_code", gamecode);
      } catch (e) {
        console.log("ERROR WITH STARTING STORY: " + e);
        alert("Error: Try Again!");
      }
    }
  }

  async function runNextLoop(choiceMade: string) {
    console.log("Running next loop...");
    const queryMessage = [
      ...storyData?.all_loop_json,
      {
        role: "user",
        content: choiceMade.toString(),
      },
    ];

    console.log(queryMessage);

    const completion = await openai.chat.completions.create({
      messages: queryMessage,
      model: "gpt-3.5-turbo",
    });

    const allLoopJSON = [
      ...storyData?.all_loop_json,
      {
        role: "user",
        content: choiceMade,
      },
      completion.choices[0].message,
    ];

    const currentPlayerChoosing = JSON.parse(
      completion.choices[0].message.content
    ).user_choice;

    await supabase
      .from("stories")
      .update({
        recent_choice_made: null,
        all_loop_json: allLoopJSON,
        current_loop_json: completion.choices[0].message,
        current_player_choosing: currentPlayerChoosing,
        current_loop: storyData?.current_loop + 1,
      })
      .eq("game_code", gamecode);
  }

  async function runFinalLoop(choiceMade: string) {
    console.log("Running final loop...");
    const queryMessage = [
      ...storyData?.all_loop_json,
      {
        role: "user",
        content:
          "Choice: " +
          choiceMade.toString() +
          ". Your next response is the final loop. This loop should end the story, and NOT give any player a choice to make. Keep using the same JSON format, but return null for player choice and choice options",
      },
    ];

    console.log(queryMessage);

    const completion = await openai.chat.completions.create({
      messages: queryMessage,
      model: "gpt-3.5-turbo",
    });

    const allLoopJSON = [
      ...storyData?.all_loop_json,
      {
        role: "user",
        content: choiceMade,
      },
      completion.choices[0].message,
    ];

    await supabase
      .from("stories")
      .update({
        recent_choice_made: null,
        all_loop_json: allLoopJSON,
        current_loop_json: completion.choices[0].message,
        current_player_choosing: null,
        current_loop: storyData?.current_loop + 1,
        story_finished: true,
      })
      .eq("game_code", gamecode);
  }

  return (
    <div
      className={`flex-1 w-full flex flex-col items-center justify-center bg-create-bg bg-cover bg-no-repeat bg-center gap-6 ${
        storyData?.story_started && "mb-6"
      }`}
    >
      <h1
        className={`${
          !storyData?.story_started ? "text-[8rem]" : "text-[4rem]"
        } text-primaryBlue`}
      >
        skytales
      </h1>
      {!storyData?.story_started ? (
        <div className="flex w-full flex-col items-center justify-center">
          <h1 className="text-4xl font-semibold">Game Code: {gamecode}</h1>
          <h1 className="text-xl font-semibold">
            Players Joined: {storyData?.current_player_count}/
            {storyData?.max_player_count}
          </h1>

          <div className="flex flex-row my-4 gap-4">{removePlayerButtons}</div>

          {storyData?.current_player_count !=
          storyData?.max_player_count ? null : (
            <button
              className="text-white my-9 bg-primaryBlue font-semibold text-lg p-3 rounded-full w-96 h-14"
              onClick={() => {
                startStory();
              }}
            >
              begin story!
            </button>
          )}
        </div>
      ) : (
        allLoopJSON?.map((loopJson, index) => {
          if (index == 0) {
            return (
              <div className="flex flex-col items-center justify-center w-[80vw]">
                <Card className="text-xl p-10">
                  <h1>Game Code: {gamecode}</h1>
                  <h1>Grade Level: {storyData?.grade_level}</h1>
                  <h1>
                    Players:{" "}
                    {JSON.stringify(storyData?.current_players)
                      .replace("[", "")
                      .replace("]", "")}
                  </h1>
                  <h1>Theme: {storyData?.theme}</h1>
                  <h1>
                    Loop: {storyData?.current_loop}/
                    {storyData.loop_count * storyData.max_player_count + 1}
                  </h1>
                  <h1>
                    Player Currently Choosing:
                    {storyData?.current_player_choosing}
                  </h1>
                </Card>
              </div>
            );
          } else if (index == 1 || index % 2 != 0) {
            return null;
          } else if (
            JSON.parse(loopJson.content)["loop"] ==
            storyData?.loop_count * storyData?.max_player_count + 1
          ) {
            return (
              <div className="flex flex-col items-center justify-center w-[80vw] gap-6">
                <h1 className="text-xl">
                  Loop: {JSON.parse(loopJson.content)["loop"]} /{" "}
                  {storyData.loop_count * storyData.max_player_count + 1}
                </h1>
                <Card className="flex flex-col min-h-[55vh] rounded mx-4 items-center justify-between shadow-lg p-10">
                  <div className="grow">
                    <h1 className="text-xl">
                      {JSON.parse(loopJson.content)["loop_text"]}
                    </h1>
                  </div>
                </Card>
              </div>
            );
          } else {
            return (
              <div className="flex flex-col items-center justify-center w-[80vw] gap-6">
                <h1 className="text-xl">
                  Loop: {JSON.parse(loopJson.content)["loop"]} /{" "}
                  {storyData.loop_count * storyData.max_player_count + 1}
                </h1>
                <Card className="flex flex-col min-h-[55vh] rounded mx-4 items-center justify-between shadow-lg p-10">
                  <div className="grow">
                    <h1 className="text-xl">
                      {JSON.parse(loopJson.content)["loop_text"]}
                    </h1>
                  </div>

                  <h1 className="text-2xl text-semibold">
                    {JSON.parse(loopJson.content)["user_choice"]}'s choice...
                  </h1>
                </Card>
                <div className="flex flex-row w-full justify-between ">
                  <div className="basis-1/2 flex flex-col gap-6 mr-4">
                    <button
                      disabled
                      className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#03CD9D] shadow text-white no-underline w-full"
                    >
                      {JSON.parse(loopJson.content)["choices"][1]}
                    </button>
                    <button
                      disabled
                      className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#EEAA26] shadow text-white no-underline w-full"
                    >
                      {JSON.parse(loopJson.content)["choices"][2]}
                    </button>
                  </div>

                  <div className="basis-1/2 flex flex-col gap-6 ml-4">
                    <button
                      disabled
                      className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#E84646] shadow text-white no-underline w-full"
                    >
                      {JSON.parse(loopJson.content)["choices"][3]}
                    </button>
                    <button
                      disabled
                      className="items-center justify-center py-4 flex text-lg font-semibold rounded-full bg-[#59B941] shadow text-white no-underline w-full"
                    >
                      {JSON.parse(loopJson.content)["choices"][4]}
                    </button>
                  </div>
                </div>
              </div>
            );
          }
        })
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
