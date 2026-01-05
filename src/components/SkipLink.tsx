export const SkipLink = () => {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2 focus:ring-offset-background font-medium text-sm transition-all"
    >
      Saltar al contenido principal
    </a>
  );
};
