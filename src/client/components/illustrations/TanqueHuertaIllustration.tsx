interface IllustrationProps {
  className?: string;
}

export function TanqueHuertaIllustration({ className }: IllustrationProps) {
  return <img src="/illustrations/tanque-huerta.png" alt="Tanque de agua que riega ocho eras de una huerta escolar" className={className} draggable={false} />;
}
