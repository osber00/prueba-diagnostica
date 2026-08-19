interface CalentamientoIllustrationProps {
  className?: string;
}

export function CalentamientoIllustration({ className }: CalentamientoIllustrationProps) {
  return <img src="/illustrations/calentamiento.png" alt="Camilo abre una sombrilla al comenzar a llover" className={className} draggable={false} />;
}
