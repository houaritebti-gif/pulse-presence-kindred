import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SharedPhotoTransitionProps {
  profileId: string;
  children: ReactNode;
  className?: string;
  enabled?: boolean;
}

/**
 * Wrapper component that enables shared element transitions for profile photos.
 * Use the same profileId across list items and detail pages to create
 * smooth morphing animations between views.
 */
const SharedPhotoTransition = ({
  profileId,
  children,
  className,
  enabled = true,
}: SharedPhotoTransitionProps) => {
  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      layoutId={`profile-photo-${profileId}`}
      className={cn("relative", className)}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
    >
      {children}
    </motion.div>
  );
};

export default SharedPhotoTransition;
