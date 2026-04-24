import { useNavigate } from "react-router-dom";
import { Button } from "@components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background flex min-h-screen w-full items-center justify-center p-6">
      <div className="flex max-w-xl flex-col items-center gap-6 text-center">
        <img
          src="/assets/images/404-illustration.png"
          alt="Ilustración de página no encontrada"
          className="h-auto w-full max-w-sm"
        />
        <p className="text-muted-foreground text-lg">
          La página que intentas acceder no existe o fue movida.
        </p>
        <Button size="lg" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
