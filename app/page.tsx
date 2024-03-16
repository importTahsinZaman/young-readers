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
    <div className="flex-1 w-full flex flex-col items-center justify-center bg-home-bg bg-cover bg-no-repeat bg-center">
      <div>
        <h1 className="text-[10rem] text-white">skytales</h1>
        <div className="flex flex-col w-full gap-3">
          <Link
            href="/join_room"
            className="items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-white shadow-2xl text-primaryBlue no-underline"
          >
            join room!
          </Link>
          <Link
            href="/create_room"
            className="items-center justify-center px-8 py-4 flex text-xl font-semibold rounded-full bg-primaryBlue shadow-2xl text-white no-underline"
          >
            create room!
          </Link>
        </div>
      </div>
    </div>
  );
}
