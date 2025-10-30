import { Button } from "@/components/ui/button";
import { Beaker, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  userEmail?: string;
}

export const Header = ({ userEmail }: HeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-800/40 bg-white backdrop-blur-xl shadow-[0_0_15px_rgba(59,130,246,0.25)]">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left Section - Logo & Title */}
        <div className="flex items-center gap-3">
          
            <img src="https://ik.imagekit.io/sri05/guvi/png-clipart-pharmaceutical-drug-chemical-structure-aesculetin-chemistry-others-angle-white.png" alt="guvi" className="w-10 h-10 text-white" />
          
          <div>
            <h1 className="text-lg font-bold text-gray-700"> Drug Discovery</h1>
            <p className="text-xs text-blue-600">AI-Powered Molecular Research</p>
          </div>
        </div>

        {/* Right Section - User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="border-blue-700/40 bg-slate-800/60 hover:bg-blue-800/70 text-white"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-slate-900/95 border border-blue-800/40 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]"
          >
            <DropdownMenuLabel className="text-blue-300">
              {userEmail || "My Account"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-blue-800/40" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="hover:bg-blue-800/50 focus:bg-blue-800/50 text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
