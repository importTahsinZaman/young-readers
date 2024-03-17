"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "@/components/loadingSpinner";

type Inputs = {
  gamecode: string;
  name: string;
};

export default function join_room() {
  const supabase = createClient();
  const router = useRouter();
  const [loadingState, setLoadingState] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  useEffect(() => {
    setLoadingState(false);
  }, []);

  const onSubmit: SubmitHandler<Inputs> = async (formData) => {
    setLoadingState(true);
    //attempt to find room data:
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("game_code", formData.gamecode);

    //check if room under that gamecode actually exists:
    if (data[0]) {
      const story_data = data[0];

      if (story_data.current_player_count >= story_data.max_player_count) {
        setLoadingState(false);
        alert("MAX PLAYERS REACHED!");
      } else if (data[0].current_players?.includes(formData.name)) {
        setLoadingState(false);
        alert("THIS PLAYER IS ALREADY IN THE ROOM!");
      } else {
        const newPlayerCount = story_data.current_player_count + 1;
        let newPlayerArray = story_data.current_players;

        if (story_data.current_players) {
          newPlayerArray.push(formData.name);
        } else {
          newPlayerArray = [formData.name];
        }

        await supabase
          .from("stories")
          .update({
            current_player_count: newPlayerCount,
            current_players: newPlayerArray,
          })
          .eq("game_code", formData.gamecode);

        router.push(`/play_room/${formData.gamecode}/${formData.name}`);
      }
    } else {
      setLoadingState(false);
      alert("INVALID GAME CODE");
    }
  };

  if (loadingState) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-home-bg bg-cover bg-no-repeat bg-center">
        <Loader></Loader>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-join-bg bg-cover bg-no-repeat bg-center">
      <h1 className="text-[8rem] text-white">skytales</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 max-w-[40%] w-[40%]"
      >
        <label className="text-white text-2xl">Your Name</label>
        <input
          className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl py-2"
          type="string"
          {...register("name", { required: true })}
        />
        {errors.name && <span>Your name is required</span>}

        <label className="text-white text-2xl">Game Code</label>
        <input
          className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl py-2"
          type="string"
          {...register("gamecode", { required: true })}
        />
        {errors.gamecode && <span>Game code is required</span>}

        <button
          type="submit"
          className="my-8 items-center justify-center py-4 flex text-2xl font-semibold rounded-full bg-white shadow-2xl text-primaryBlue no-underline"
        >
          join game!
        </button>
      </form>
      <button
        className="max-w-[40%] w-[40%] items-center justify-center py-4 flex text-2xl font-semibold rounded-full bg-primaryBlue shadow-2xl text-white no-underline"
        onClick={() => {
          setLoadingState(true);
          router.push("/");
        }}
      >
        return home
      </button>
    </div>
  );
}
