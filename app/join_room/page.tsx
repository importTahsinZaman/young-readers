"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Inputs = {
  gamecode: string;
  name: string;
};

export default function join_room() {
  const supabase = createClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (formData) => {
    console.log(formData);

    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .eq("game_code", formData.gamecode);

    console.log(data[0]);

    const newPlayerCount = data[0].current_player_count + 1;
    let newPlayerArray = data[0].current_players;

    if (data[0].current_players) {
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

    router.push(`/play_room/${formData.gamecode}`);
  };

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <label>Name:</label>
      <input type="string" {...register("name", { required: true })} />
      {errors.name && <span>Your name is required</span>}

      <label>Game Code:</label>
      <input type="string" {...register("gamecode", { required: true })} />
      {errors.gamecode && <span>Game code is required</span>}

      <input type="submit" />
    </form>
  );
}
