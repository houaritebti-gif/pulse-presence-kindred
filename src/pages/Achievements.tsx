import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AchievementsDisplay } from "@/components/AchievementsDisplay";
import PageHeader from "@/components/PageHeader";

const Achievements = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-24 px-4 sm:px-6 py-6 sm:py-8">
      <PageHeader 
        backLabel="Volver"
        rightContent={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/leaderboard")}
            className="gap-2"
          >
            <Trophy className="w-4 h-4" />
            Ranking
          </Button>
        }
      />

      <main>
        <AchievementsDisplay showHeader={true} />
      </main>
    </div>
  );
};

export default Achievements;
