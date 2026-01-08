import { ArrowLeft, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";

const Achievements = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-display font-semibold">Logros</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/leaderboard")}
            className="gap-2"
          >
            <Trophy className="w-4 h-4" />
            Ranking
          </Button>
        </div>
      </header>

      <main className="p-4">
        <AchievementsDisplay showHeader={true} />
      </main>
    </div>
  );
};

export default Achievements;
