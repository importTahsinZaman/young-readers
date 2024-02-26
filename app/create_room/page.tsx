"use client";

import { useForm, SubmitHandler } from "react-hook-form";

type Inputs = {
  theme: string;
  playerCount: number;
  loopCount: number;
  gradeLevel: number;
};

export default function create_room() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>();

  const onSubmit: SubmitHandler<Inputs> = (data) => console.log(data);

  console.log(watch("theme")); // watch input value by passing the name of it

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
