import DeployButton from "../components/DeployButton";
import AuthButton from "../components/AuthButton";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import ConnectSupabaseSteps from "@/components/tutorial/ConnectSupabaseSteps";
import SignUpUserSteps from "@/components/tutorial/SignUpUserSteps";
import Header from "@/components/Header";

export default async function Index() {
  const canInitSupabaseClient = () => {
    // This function is just for the interactive tutorial.
    // Feel free to remove it once you have Supabase connected.
    try {
      createClient();
      return true;
    } catch (e) {
      return false;
    }
  };

  const isSupabaseConnected = canInitSupabaseClient();

  return (
    <div className="flex-1 w-full flex flex-col gap-10 items-center justify-center">
      <h1 className="text-[10rem] font-DMSerifDisplay">Story Quest</h1>
      <div className="flex flex-row">
        <Link
          href="/create_room"
          className="py-4 px-4 flex text-xl font-semibold rounded-md no-underline bg-btn-background hover:bg-btn-background-hover mx-3"
        >
          Create Room
        </Link>
        <Link
          href="/join_room"
          className="py-4 px-7 text-xl font-semibold flex rounded-md no-underline bg-btn-background hover:bg-btn-background-hover mx-3"
        >
          Join Room
        </Link>
      </div>
    </div>
  );
}
