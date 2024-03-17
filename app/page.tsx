"use client";

import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/loadingSpinner";

export default function Index() {
  const router = useRouter();
  const [loadingState, setLoadingState] = useState(false);

  useEffect(() => {
    setLoadingState(false);
  }, []);

  if (loadingState) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-home-bg bg-cover bg-no-repeat bg-center">
        <Loader></Loader>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-home-bg bg-cover bg-no-repeat bg-center">
      <div>
        <h1 className="text-[10rem] text-white">skytales</h1>
        <div className="flex flex-col w-full gap-3">
          <button
            onClick={() => {
              setLoadingState(true);
              router.push("/join_room");
            }}
            className="items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-white shadow-2xl text-primaryBlue no-underline"
          >
            join room!
          </button>
          <button
            onClick={() => {
              setLoadingState(true);
              router.push("/create_room");
            }}
            className="items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-primaryBlue shadow-2xl text-white no-underline"
          >
            create room!
          </button>
        </div>
      </div>
    </div>
  );
}
