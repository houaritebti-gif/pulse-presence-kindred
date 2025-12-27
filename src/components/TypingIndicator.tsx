import { motion } from "framer-motion";

export const TypingIndicator = () => {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -6 },
  };

  const containerVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="flex items-center gap-1 px-2 py-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            duration: 0.4,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.15,
          }}
          className="h-2 w-2 rounded-full bg-primary/70"
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Escribiendo</span>
    </motion.div>
  );
};
