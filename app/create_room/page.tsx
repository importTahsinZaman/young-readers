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
    <div className="flex-1 w-full flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col max-w-[70%] w-[70%]"
      >
        <label className="text-lg">Theme</label>
        <input {...register("theme", { required: true })} />
        {errors.theme && (
          <span className="text-red-500">Theme is required</span>
        )}

        <label className="text-lg">Number of Players:</label>
        <input
          type="number"
          step="1"
          max={5}
          min={2}
          defaultValue={4}
          {...register("playerCount", { required: true })}
        />
        {errors.playerCount && (
          <span className="text-red-500">Player count is required</span>
        )}

        <label className="text-lg">Number of Loops:</label>
        <input
          type="number"
          step="1"
          max={5}
          min={2}
          defaultValue={4}
          {...register("loopCount", { required: true })}
        />
        {errors.loopCount && (
          <span className="text-red-500">Loop count is required</span>
        )}

        <label className="text-lg">Grade Level:</label>
        <input
          type="number"
          step="1"
          max={5}
          min={2}
          defaultValue={5}
          {...register("gradeLevel", { required: true })}
        />
        {errors.gradeLevel && (
          <span className="text-red-500">Grade level is required</span>
        )}

        <button className="border my-4 border-black p-4 text-lg" type="submit">
          Create Story
        </button>
      </form>
      <button
        className="border my-4 border-black p-4 text-lg w-[70%] max-w-[70%]"
        onClick={() => {
          router.push("/");
        }}
      >
        Return to Home
      </button>
    </div>
  );
}
