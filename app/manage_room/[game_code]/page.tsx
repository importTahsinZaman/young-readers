"use client";

import { createClient } from "@/utils/supabase/client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import OpenAI from "openai";

export default function manage_room() {
  const supabase = createClient();
  const pathname = usePathname();
  const [gamecode, setGamecode] = useState("");
  const [storyData, setStoryData] = useState<any[] | null>(null);

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
    };
    getData();
  }, [pathname]);

  const handleChanges = (payload: any) => {
    setStoryData(payload.new);

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
      const completion = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant.`,
          },
          {
            role: "user",
            content: `Your job is to write a multiplayer choose your own adventure story. There are going to be users who correspond to characters in the story, and your job is to write an interactive story based on a given theme. The "loop" parameter is how many times each user will be given the opportunity to make a choice in the story.  EVERY one of your responses should be A SINGLE loop, IN JSON FORMAT (this is mandatory) of { "loop": (loop number), "loop_text": (the text in the loop), "user_choice": (which user is making a choice), "choices": { "1": "", "2": "", "3": "" } } So if there are 4 loops and 5 characters, there will be 20 total choices made (4 choices by each of 5 characters/users.) The story should change based on the choice made in each loop. Give one loop at a time and the user will input which choice they want. Write the story from the third person. There should be 3 choice options per loop. The very last loop should be #(number of players * number of loops) + 1. This loop should conclude the story, without giving a choice to any user. So if there are 4 loops and 5 characters/users, the last loop would be loop #21. THE USER WILL INPUT THEIR CHOICE AFTER EVERY LOOP, DO NOT DECIDE IT FOR YOURSELF. One user should not be in charge of making the choice for more than 2 loops in a row! Here are the parameters: { Theme: ${storyData?.theme}, Characters: ${storyData?.current_players}, Loops: ${storyData?.loop_count} Grade Level: ${storyData?.grade_level} }`,
          },
        ],
        model: "gpt-3.5-turbo",
      });

      console.log(completion.choices[0].message);

      const allLoopJSON = [
        {
          role: "system",
          content: `You are a helpful assistant.`,
        },
        {
          role: "user",
          content: `Your job is to write a multiplayer choose your own adventure story. There are going to be users who correspond to characters in the story, and your job is to write an interactive story based on a given theme. The "loop" parameter is how many times each user will be given the opportunity to make a choice in the story.  EVERY one of your responses should be A SINGLE loop, IN JSON FORMAT (this is mandatory) of { "loop": (loop number), "loop_text": (the text in the loop), "user_choice": (which user is making a choice), "choices": { "1": "", "2": "", "3": "" } } So if there are 4 loops and 5 characters, there will be 20 total choices made (4 choices by each of 5 characters/users.) The story should change based on the choice made in each loop. Give one loop at a time and the user will input which choice they want. Write the story from the third person. There should be 3 choice options per loop. The very last loop should be #(number of players * number of loops) + 1. This loop should conclude the story, without giving a choice to any user. So if there are 4 loops and 5 characters/users, the last loop would be loop #21. THE USER WILL INPUT THEIR CHOICE AFTER EVERY LOOP, DO NOT DECIDE IT FOR YOURSELF. One user should not be in charge of making the choice for more than 2 loops in a row! Here are the parameters: { Theme: ${storyData?.theme}, Characters: ${storyData?.current_players}, Loops: ${storyData?.loop_count} Grade Level: ${storyData?.grade_level} }`,
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
    <>
      <div className="max-w-[50%]">
        <pre>{JSON.stringify(storyData, null, 2)}</pre>
      </div>
      {storyData?.story_started ? null : (
        <div className="flex flex-col">
          {removePlayerButtons}
          <button
            onClick={() => {
              startStory();
            }}
          >
            Start Story
          </button>
        </div>
      )}
    </>
  );
}
