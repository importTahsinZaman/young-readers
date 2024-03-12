"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

type Inputs = {
  theme: string;
  playerCount: number;
  loopCount: number;
  gradeLevel: number;
};

export default function create_room() {
  const supabase = createClient();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = async (formData) => {
    console.log(formData);
    const { data, error } = await supabase
      .from("stories")
      .insert({
        theme: formData.theme,
        max_player_count: formData.playerCount,
        loop_count: formData.loopCount,
        grade_level: formData.gradeLevel,
      })
      .select();
    console.log(data[0].id);

    const {} = await supabase
      .from("stories")
      .update({ game_code: data[0].id.toString().substring(0, 8) })
      .eq("id", data[0].id);

    router.push(`/manage_room/${data[0].id.toString().substring(0, 8)}`);
  };

  return (
    /* "handleSubmit" will validate your inputs before invoking "onSubmit" */
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <label>theme</label>
      <input {...register("theme", { required: true })} />
      {errors.theme && <span>Theme is required</span>}

      <label>Number of Players:</label>
      <input
        type="number"
        step="1"
        max={5}
        min={2}
        defaultValue={2}
        {...register("playerCount", { required: true })}
      />
      {errors.playerCount && <span>Player count is required</span>}

      <label>Number of Loops:</label>
      <input
        type="number"
        step="1"
        max={5}
        min={2}
        defaultValue={2}
        {...register("loopCount", { required: true })}
      />
      {errors.loopCount && <span>Loop count is required</span>}

      <label>Grade Level:</label>
      <input
        type="number"
        step="1"
        max={5}
        min={2}
        defaultValue={2}
        {...register("gradeLevel", { required: true })}
      />
      {errors.gradeLevel && <span>Grade level is required</span>}

      <input type="submit" />
    </form>
  );
}
