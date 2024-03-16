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
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-create-bg bg-cover bg-no-repeat bg-center">
      <h1 className="text-[8rem] text-primaryBlue">skytales</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col max-w-[45%] w-[45%] gap-4"
      >
        <label className="text-2xl text-primaryBlue">Theme</label>
        <input
          className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl"
          {...register("theme", { required: true })}
        />
        {errors.theme && (
          <span className="text-red-500 ">Theme is required</span>
        )}
        <div className="flex flex-row justify-between gap-5">
          <div className="flex flex-col grow gap-4">
            <label className="text-2xl text-primaryBlue"># of Players</label>
            <input
              type="number"
              step="1"
              max={5}
              min={2}
              defaultValue={4}
              className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl"
              {...register("playerCount", { required: true })}
            />
            {errors.playerCount && (
              <span className="text-red-500">Player count is required</span>
            )}
          </div>

          <div className="flex flex-col grow gap-4">
            <label className="text-2xl text-primaryBlue"># of Loops</label>
            <input
              type="number"
              step="1"
              max={5}
              min={2}
              defaultValue={4}
              className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl"
              {...register("loopCount", { required: true })}
            />
            {errors.loopCount && (
              <span className="text-red-500">Loop count is required</span>
            )}
          </div>
        </div>

        <label className="text-2xl text-primaryBlue">Grade Level</label>
        <input
          type="number"
          step="1"
          max={5}
          min={2}
          defaultValue={5}
          className="rounded-xl border-2 border-primaryBlue shadow-inner text-xl"
          {...register("gradeLevel", { required: true })}
        />
        {errors.gradeLevel && (
          <span className="text-red-500">Grade level is required</span>
        )}

        <button
          className="items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-primaryBlue shadow-2xl text-white no-underline"
          type="submit"
        >
          create story!
        </button>
      </form>
      <button
        className="my-4 max-w-[45%] w-[45%] items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-white shadow-2xl text-primaryBlue no-underline"
        onClick={() => {
          router.push("/");
        }}
      >
        return home
      </button>
    </div>
  );
}
