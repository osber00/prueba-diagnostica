interface IllustrationProps {
  className?: string;
}

export function MangosIllustration({ className }: IllustrationProps) {
  return <img src="/illustrations/mangos.png" alt="Tres cajas de mangos junto a bananos maduros y plátanos verdes" className={className} draggable={false} />;
}
