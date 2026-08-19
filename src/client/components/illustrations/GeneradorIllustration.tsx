interface IllustrationProps {
  className?: string;
}

export function GeneradorIllustration({ className }: IllustrationProps) {
  return <img src="/illustrations/generador.png" alt="Generador de una celebración conectado a luces, parlantes y un congelador" className={className} draggable={false} />;
}
